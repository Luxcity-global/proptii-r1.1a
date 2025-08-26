import axios from 'axios';

function extractRegionCodeFromHtml(html: string): string | undefined {
  console.log('[Rightmove] Extracting from HTML, length:', html.length);
  
  // Try JSON patterns (most common in modern pages)
  const jsonMatch = html.match(/"locationIdentifier"\s*:\s*"REGION\^(\d+)"/i);
  if (jsonMatch) {
    console.log('[Rightmove] Found via JSON pattern:', `REGION^${jsonMatch[1]}`);
    return `REGION^${jsonMatch[1]}`;
  }

  // Try URL-encoded patterns in current URL or redirects
  const encMatch = html.match(/locationIdentifier=REGION%5E(\d+)/i);
  if (encMatch) {
    console.log('[Rightmove] Found via URL-encoded pattern:', `REGION^${encMatch[1]}`);
    return `REGION^${encMatch[1]}`;
  }

  // Try hidden input fields
  const inputMatch = html.match(/name=\"locationIdentifier\"[^>]*value=\"REGION\^(\d+)\"/i);
  if (inputMatch) {
    console.log('[Rightmove] Found via hidden input:', `REGION^${inputMatch[1]}`);
    return `REGION^${inputMatch[1]}`;
  }

  // Try canonical link
  const canonicalMatch = html.match(/<link[^>]*rel=\"canonical\"[^>]*href=\"[^\"]*locationIdentifier=REGION%5E(\d+)[^\"]*\"/i);
  if (canonicalMatch) {
    console.log('[Rightmove] Found via canonical link:', `REGION^${canonicalMatch[1]}`);
    return `REGION^${canonicalMatch[1]}`;
  }

  // Try data attributes
  const dataMatch = html.match(/data-[^=]*locationidentifier[^=]*=\"REGION\^(\d+)\"/i);
  if (dataMatch) {
    console.log('[Rightmove] Found via data attribute:', `REGION^${dataMatch[1]}`);
    return `REGION^${dataMatch[1]}`;
  }

  // Try window/global variables
  const windowMatch = html.match(/window\.[^=]*locationIdentifier[^=]*=\s*['"](REGION\^\d+)['"]/i);
  if (windowMatch) {
    console.log('[Rightmove] Found via window variable:', windowMatch[1]);
    return windowMatch[1];
  }

  // Try more flexible JSON patterns
  const flexJsonMatch = html.match(/['"](REGION\^\d+)['"][^}]*location/i);
  if (flexJsonMatch) {
    console.log('[Rightmove] Found via flexible JSON:', flexJsonMatch[1]);
    return flexJsonMatch[1];
  }

  console.log('[Rightmove] No locationIdentifier patterns found in HTML');
  return undefined;
}

export async function resolveRightmoveLocationIdentifier(locationPhrase: string, isRental: boolean): Promise<string | undefined> {
  console.log('[Rightmove] Starting location resolution for:', locationPhrase, 'isRental:', isRental);
  if (!locationPhrase || locationPhrase.trim().length === 0) {
    console.log('[Rightmove] Empty location phrase, returning undefined');
    return undefined;
  }

  const base = isRental
    ? 'https://www.rightmove.co.uk/property-to-rent/find.html'
    : 'https://www.rightmove.co.uk/property-for-sale/find.html';

  const params = new URLSearchParams();
  params.set('searchLocation', locationPhrase);
  params.set('useLocationIdentifier', 'true');
  params.set('radius', '0.0');
  const url = `${base}?${params.toString()}`;

  try {
    // Apify actor/task integration (preferred if configured)
    const apifyToken = process.env.APIFY_TOKEN;
    // Allow either username~actor-name or username/actor-name; normalize to ~
    const apifyActorIdRaw = process.env.APIFY_RIGHTMOVE_ACTOR_ID; // e.g. username~rightmove-location-resolver or username/my-actor
    const apifyTaskIdRaw = process.env.APIFY_RIGHTMOVE_TASK_ID;   // optional alternative
    const apifyActorId = apifyActorIdRaw ? apifyActorIdRaw.replace('/', '~') : undefined;
    const apifyTaskId = apifyTaskIdRaw ? apifyTaskIdRaw.replace('/', '~') : undefined;
    if (apifyToken && (apifyActorId || apifyTaskId)) {
      try {
        const baseRunUrl = apifyActorId
          ? `https://api.apify.com/v2/acts/${encodeURIComponent(apifyActorId)}/runs?token=${encodeURIComponent(apifyToken)}&waitForFinish=120`
          : `https://api.apify.com/v2/actor-tasks/${encodeURIComponent(apifyTaskId as string)}/runs?token=${encodeURIComponent(apifyToken)}&waitForFinish=120`;
        console.log('[Rightmove] Resolving location via Apify', apifyActorId ? `(actor ${apifyActorId})` : `(task ${apifyTaskId})`, `for: "${locationPhrase}"`);
        const runResp = await axios.post(baseRunUrl, { location: locationPhrase, isRental }, {
          headers: { 'content-type': 'application/json' },
          timeout: 20000,
        });
        const runData = runResp.data?.data;
        const storeId: string | undefined = runData?.defaultKeyValueStoreId;
        const status: string | undefined = runData?.status;
        console.log('[Rightmove] Apify run status:', status);
        if (status === 'SUCCEEDED' && storeId) {
          const outputUrl = `https://api.apify.com/v2/key-value-stores/${encodeURIComponent(storeId)}/records/OUTPUT?token=${encodeURIComponent(apifyToken)}`;
          const outResp = await axios.get(outputUrl, { timeout: 12000 });
          const id = (outResp.data && (outResp.data.locationIdentifier || outResp.data.id)) as string | undefined;
          if (id && /^REGION\^\d+$/.test(id)) {
            console.log('[Rightmove] Apify resolved locationIdentifier:', id);
            return id;
          }
        }
      } catch {
        // fall through to other strategies
      }
    }

    // Optional: Apify integration via environment variable specifying a resolver endpoint
    const apifyUrl = process.env.APIFY_RIGHTMOVE_LOCATION_RESOLVER_URL;
    if (apifyUrl) {
      try {
        const apifyResp = await axios.post(apifyUrl, { location: locationPhrase, isRental }, {
          headers: { 'content-type': 'application/json' },
          timeout: 15000,
        });
        const id = (apifyResp.data && (apifyResp.data.locationIdentifier || apifyResp.data.id)) as string | undefined;
        if (id && /^REGION\^\d+$/.test(id)) {
          return id;
        }
      } catch (e) {
        // fall through
      }
    }

    // Try redirect/canonical via Location header (no redirects)
    try {
      const headUrl = `${base}?useLocationIdentifier=true&searchLocation=${encodeURIComponent(locationPhrase)}&radius=0.0`;
      console.log('[Rightmove] Trying redirect-based resolution for:', headUrl);
      const redirectResp = await axios.get(headUrl, {
        maxRedirects: 0,
        validateStatus: (s) => s >= 200 && s < 400,
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
        },
        timeout: 12000,
      });
      const locHeader: string | undefined = (redirectResp.headers?.location as string | undefined);
      if (locHeader) {
        console.log('[Rightmove] Redirect Location header:', locHeader);
        const m = locHeader.match(/locationIdentifier=REGION%5E(\d+)/i);
        if (m) {
          const id = `REGION^${m[1]}`;
          console.log('[Rightmove] Redirect resolved locationIdentifier:', id);
          return id;
        }
      }
      // Some environments expose final URL on response.request
      const anyResp: any = redirectResp as any;
      const finalUrl: string | undefined = anyResp?.request?.res?.responseUrl || anyResp?.request?.path;
      if (finalUrl) {
        const m2 = finalUrl.match(/locationIdentifier=REGION%5E(\d+)/i);
        if (m2) {
          const id = `REGION^${m2[1]}`;
          console.log('[Rightmove] Final URL resolved locationIdentifier:', id);
          return id;
        }
      }
    } catch (e) {
      console.log('[Rightmove] Redirect-based resolution failed:', e instanceof Error ? e.message : String(e));
    }

    // Try Rightmove search URL approach to extract locationIdentifier from redirects/canonical
    try {
      console.log('[Rightmove] Trying search page approach for:', locationPhrase);
      const searchUrl = `${base}?searchLocation=${encodeURIComponent(locationPhrase)}&radius=0.0`;
      console.log('[Rightmove] Search URL:', searchUrl);
      const searchResp = await axios.get(searchUrl, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      const extracted = extractRegionCodeFromHtml(searchResp.data);
      if (extracted) {
        console.log('[Rightmove] Search page resolved locationIdentifier:', extracted);
        return extracted;
      } else {
        console.log('[Rightmove] No locationIdentifier found in search page HTML');
      }
    } catch (e) {
      console.log('[Rightmove] Search page approach failed:', e instanceof Error ? e.message : String(e));
    }

    // All approaches failed
    console.log('[Rightmove] All resolution approaches failed for:', locationPhrase);
    return undefined;
  } catch {
    return undefined;
  }
}

export function extractLocationPhraseFromQuery(query: string): { phrase: string; isRental: boolean } {
  const q = query || '';
  const isRental = /\b(rent|pcm|pw|per\s+week|per\s+month|letting)\b/i.test(q);
  const inMatch = q.match(/in\s+([a-zA-Z\s,]+?)(?:\s+(?:for|under|to|within|with|near)\b|$)/i);
  const phrase = (inMatch ? inMatch[1] : '').trim();
  return { phrase, isRental };
}

