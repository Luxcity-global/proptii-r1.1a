/**
 * Proptii → GTM automation event client.
 * Posts the shared envelope to the GTM gateway. Failures are swallowed so the
 * product UI never blocks on marketing infrastructure.
 *
 * Staging: set VITE_GTM_GATEWAY_URL and VITE_GTM_GATEWAY_SECRET.
 * Production should proxy through a backend rather than shipping the secret.
 */

export type GtmRole = "buyer" | "renter" | "landlord" | "agent";

export type GtmEventInput = {
  name: string;
  actor: {
    profileId: string;
    anonymousId?: string | null;
    role: GtmRole;
  };
  subject: {
    type: "property" | "tenancy" | "report" | "invite";
    id: string;
  };
  context?: {
    source?: "app" | "site" | "partner";
    campaign?: Record<string, string>;
    partnerId?: string | null;
  };
  properties?: Record<string, string | number | boolean | null>;
};

const FIRST_REPORT_KEY = "proptii_gtm_first_report_emitted";

/** Stable UUID for anonymous browser sessions. */
export function getAnonymousId(): string {
  const key = "proptii_gtm_anonymous_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

/** Maps a local audience lens to a GTM actor role. */
export function roleFromAudience(audience?: string): GtmRole {
  switch (audience) {
    case "landlord":
    case "agent":
    case "buyer":
      return audience;
    case "homeowner":
      return "buyer";
    case "tenant":
    default:
      return "renter";
  }
}

/** Deterministic UUID-shaped id from an opaque string (e.g. email / homeAccountId). */
export function profileIdFromKey(key: string): string {
  const bytes = new Uint8Array(16);
  const data = new TextEncoder().encode(key);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = data[i % data.length] ^ (i * 31);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** True once per browser until cleared — used for report_run.is_first. */
export function consumeFirstReportFlag(): boolean {
  if (localStorage.getItem(FIRST_REPORT_KEY) === "1") return false;
  localStorage.setItem(FIRST_REPORT_KEY, "1");
  return true;
}

/** Emits account_created at most once per profile in this browser. */
export function shouldEmitAccountCreated(profileId: string, claims?: Record<string, unknown> | null): boolean {
  const key = `proptii_gtm_account_created_${profileId}`;
  if (localStorage.getItem(key) === "1") return false;
  const newUserClaim = claims?.newUser === true || claims?.newUser === "true";
  // B2C combined SignUpSignIn: prefer the newUser claim when present; otherwise first success.
  if (claims && "newUser" in claims && !newUserClaim) return false;
  localStorage.setItem(key, "1");
  return true;
}

/** SHA-256 hex of a normalised address (first 32 chars) for report_run.address_hash. */
export async function hashAddress(address: string): Promise<string> {
  const normalised = address.trim().toLowerCase().replace(/\s+/g, " ");
  const data = new TextEncoder().encode(normalised);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/** Stable report id for a property address in this browser session. */
export function reportIdForAddress(address: string): string {
  return profileIdFromKey(`report:${address.trim().toLowerCase()}`);
}

/** Sends one event to the GTM gateway. No-ops when env is missing. */
export async function emitGtmEvent(input: GtmEventInput): Promise<void> {
  const url = import.meta.env.VITE_GTM_GATEWAY_URL as string | undefined;
  const secret = import.meta.env.VITE_GTM_GATEWAY_SECRET as string | undefined;
  if (!url || !secret) {
    return;
  }

  const envelope = {
    event_id: crypto.randomUUID(),
    name: input.name,
    occurred_at: new Date().toISOString(),
    actor: {
      profile_id: input.actor.profileId,
      anonymous_id: input.actor.anonymousId ?? getAnonymousId(),
      role: input.actor.role,
    },
    subject: input.subject,
    context: {
      source: input.context?.source ?? "app",
      campaign: input.context?.campaign ?? {},
      partner_id: input.context?.partnerId ?? null,
    },
    properties: input.properties ?? {},
  };

  try {
    await fetch(`${url.replace(/\/$/, "")}/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-gateway-secret": secret,
      },
      body: JSON.stringify(envelope),
      keepalive: true,
    });
  } catch {
    // Intentionally ignored — product must not fail if GTM is down.
  }
}
