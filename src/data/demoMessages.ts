import type { Conversation, Message, SendMessageDto } from '../types/messaging';

const CONV_PREFIX = 'demo-conv-';
const MSG_PREFIX = 'demo-msg-';

type Persona = 'agent' | 'tenant';

const PERSONA_IDS: Record<Persona, string> = {
  agent: 'agent-test-001',
  tenant: 'tenant-test-001',
};

/** Which Dev Login demo persona is signed in, if any. */
function currentPersona(): Persona | null {
  try {
    const token = localStorage.getItem('mock_token');
    if (token === `mock-token-${PERSONA_IDS.agent}`) return 'agent';
    if (token === `mock-token-${PERSONA_IDS.tenant}`) return 'tenant';
  } catch {
    /* storage unavailable */
  }
  return null;
}

export const isDemoMessagingSession = () => currentPersona() !== null;
export const isDemoConversation = (id?: string | null) => Boolean(id?.startsWith(CONV_PREFIX));
export const isDemoMessage = (id?: string | null) => Boolean(id?.startsWith(MSG_PREFIX));

type Seed = {
  persona: Persona;
  key: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  landlordName: string;
  landlordEmail?: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  /** [sender, minutesAgo, body, readByRecipient?] */
  lines: Array<['tenant' | 'landlord', number, string, boolean?]>;
};

const HOUR = 60;
const DAY = 24 * HOUR;

const SEEDS: Seed[] = [
  // Olivia Bennett (agent) talking to her managed tenants
  {
    persona: 'agent',
    key: 'agent-tom',
    tenantId: 'agent-tn-tom',
    tenantName: 'Tom Bradley',
    landlordId: PERSONA_IDS.agent,
    landlordName: 'Olivia Bennett',
    propertyId: 'agent-prop-wilmslow',
    propertyTitle: '22 Wilmslow Road',
    propertyAddress: '22 Wilmslow Road, Didsbury, Manchester, M20 2RN',
    lines: [
      ['landlord', 3 * DAY, 'Hi Tom, a quick reminder that September rent of £1,850 is now overdue. Can you let me know when to expect it?', true],
      ['tenant', 3 * DAY - 2 * HOUR, "Hi Olivia, sorry about that. I've just started a new job and my first salary lands on the 28th.", true],
      ['landlord', 2 * DAY, 'Thanks for letting me know. Would a two-part payment plan help? Half now and half on the 28th?', true],
      ['tenant', 40, 'That would really help, thank you. I can send £925 today.', false],
      ['tenant', 38, 'Also, the boiler pressure keeps dropping. Could someone take a look this week?', false],
    ],
  },
  {
    persona: 'agent',
    key: 'agent-aisha',
    tenantId: 'agent-tn-aisha',
    tenantName: 'Aisha Khan',
    landlordId: PERSONA_IDS.agent,
    landlordName: 'Olivia Bennett',
    propertyId: 'agent-prop-deansgate',
    propertyTitle: '14 Deansgate, Apt 3',
    propertyAddress: '14 Deansgate, Apt 3, Manchester, M3 1AZ',
    lines: [
      ['tenant', DAY + 5 * HOUR, 'Hi Olivia, the kitchen extractor fan has stopped working. Is it OK to arrange a repair?', true],
      ['landlord', DAY + 3 * HOUR, "Thanks Aisha. I've booked our contractor for Thursday between 9am and 12pm. Does that suit?", true],
      ['tenant', 3 * HOUR, 'Thursday morning is perfect, I will be working from home.', false],
    ],
  },
  {
    persona: 'agent',
    key: 'agent-priya',
    tenantId: 'agent-tn-priya',
    tenantName: 'Priya Patel',
    landlordId: PERSONA_IDS.agent,
    landlordName: 'Olivia Bennett',
    propertyId: 'agent-prop-chorlton',
    propertyTitle: '41 Chorlton Green',
    propertyAddress: '41 Chorlton Green, Manchester, M21 9HS',
    lines: [
      ['landlord', 6 * DAY, 'Hi Priya, your landlord is happy to renew next spring at the same rent. Would you like me to prepare the paperwork?', true],
      ['tenant', 5 * DAY, "Yes please! That's great news. Another 12 months would be ideal.", true],
      ['landlord', 5 * DAY - HOUR, "Lovely. I'll send the renewal agreement over for e-signature closer to the date.", true],
    ],
  },
  // Sarah Jones (tenant) talking to her landlord and an agent
  {
    persona: 'tenant',
    key: 'tenant-john',
    tenantId: PERSONA_IDS.tenant,
    tenantName: 'Sarah Jones',
    landlordId: 'landlord-test-001',
    landlordName: 'John Smith',
    landlordEmail: 'landlord@test.proptii.co',
    propertyId: 'landlord-prop-oxford',
    propertyTitle: '27 Oxford Road, Flat 4',
    propertyAddress: '27 Oxford Road, Flat 4, Manchester, M1 5QA',
    lines: [
      ['landlord', 4 * DAY, "Hi Sarah, welcome aboard! The tenancy agreement is signed on my side. Keys will be ready from the 1st.", true],
      ['tenant', 4 * DAY - 3 * HOUR, 'Thank you John! Could I collect them on the 1st at around 10am?', true],
      ['landlord', 3 * DAY, "10am works. I've also sent a pet addendum for your dog, please sign when you get a chance.", true],
      ['landlord', 50, 'Quick one: the meter readings are in the inventory pack. Let me know if anything looks off at move-in.', false],
    ],
  },
  {
    persona: 'tenant',
    key: 'tenant-olivia',
    tenantId: PERSONA_IDS.tenant,
    tenantName: 'Sarah Jones',
    landlordId: PERSONA_IDS.agent,
    landlordName: 'Olivia Bennett',
    landlordEmail: 'agent@test.proptii.co',
    propertyId: 'agent-prop-king',
    propertyTitle: '8 King Street, Flat 12',
    propertyAddress: '8 King Street, Flat 12, Manchester, M2 6AQ',
    lines: [
      ['tenant', 2 * DAY, 'Hi Olivia, is the King Street flat still available? I would love to view it this week.', true],
      ['landlord', 2 * DAY - 2 * HOUR, "Hi Sarah, it is! I've confirmed a viewing for you. Please bring photo ID.", true],
      ['landlord', 2 * HOUR, 'Just a reminder that the holding deposit agreement is waiting for your signature.', false],
    ],
  },
];

const minutesAgo = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

type Entry = { persona: Persona; conversation: Conversation; messages: Message[] };
let store: Map<string, Entry> | null = null;

function getStore() {
  if (store) return store;
  store = new Map();
  for (const seed of SEEDS) {
    const conversationId = `${CONV_PREFIX}${seed.key}`;
    const messages: Message[] = seed.lines.map(([sender, mins, body, read], i) => {
      const sentAt = minutesAgo(mins);
      const ownedBySelf = (seed.persona === 'agent') === (sender === 'landlord');
      return {
        id: `${MSG_PREFIX}${seed.key}-${i + 1}`,
        conversationId,
        senderId: sender === 'landlord' ? seed.landlordId : seed.tenantId,
        senderRole: sender,
        body,
        attachmentIds: [],
        sentAt,
        readAt: ownedBySelf || read ? sentAt : null,
        isDeleted: false,
        deletedAt: null,
      };
    });
    const last = messages[messages.length - 1].sentAt;
    store.set(conversationId, {
      persona: seed.persona,
      messages,
      conversation: {
        id: conversationId,
        propertyId: seed.propertyId,
        tenantId: seed.tenantId,
        landlordId: seed.landlordId,
        createdAt: messages[0].sentAt,
        updatedAt: last,
        lastMessageAt: last,
        isDeleted: false,
        deletedAt: null,
        propertyTitle: seed.propertyTitle,
        propertyAddress: seed.propertyAddress,
        tenantName: seed.tenantName,
        landlordName: seed.landlordName,
        landlordEmail: seed.landlordEmail,
        unreadForTenant: 0,
        unreadForLandlord: 0,
      },
    });
  }
  return store;
}

const unreadFrom = (messages: Message[], role: Message['senderRole']) =>
  messages.filter((m) => !m.isDeleted && m.senderRole === role && m.readAt === null).length;

function entriesForSession(): Entry[] {
  const persona = currentPersona();
  if (!persona) return [];
  return Array.from(getStore().values()).filter((entry) => entry.persona === persona);
}

export function getDemoConversations(): Conversation[] {
  return entriesForSession()
    .map(({ conversation, messages }) => ({
      ...conversation,
      unreadForLandlord: unreadFrom(messages, 'tenant'),
      unreadForTenant: unreadFrom(messages, 'landlord'),
    }))
    .sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''));
}

export function getDemoMessages(conversationId: string): Message[] {
  return (getStore().get(conversationId)?.messages || []).map((m) => ({ ...m }));
}

export function getDemoUnreadCount(): number {
  return entriesForSession().reduce(
    (sum, { persona, messages }) => sum + unreadFrom(messages, persona === 'agent' ? 'tenant' : 'landlord'),
    0,
  );
}

export function sendDemoMessage(conversationId: string, dto: SendMessageDto): Message {
  const entry = getStore().get(conversationId);
  if (!entry) throw new Error('Demo conversation not found');
  const asLandlord = entry.persona === 'agent';
  const sentAt = new Date().toISOString();
  const message: Message = {
    id: `${MSG_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    senderId: asLandlord ? entry.conversation.landlordId : entry.conversation.tenantId,
    senderRole: asLandlord ? 'landlord' : 'tenant',
    body: dto.body,
    attachmentIds: dto.attachmentIds || [],
    sentAt,
    readAt: null,
    isDeleted: false,
    deletedAt: null,
  };
  entry.messages.push(message);
  entry.conversation.lastMessageAt = sentAt;
  entry.conversation.updatedAt = sentAt;
  return { ...message };
}

function findMessage(messageId: string) {
  for (const { messages } of getStore().values()) {
    const message = messages.find((m) => m.id === messageId);
    if (message) return message;
  }
  return null;
}

export function markDemoRead(messageId: string): void {
  const message = findMessage(messageId);
  if (message && message.readAt === null) message.readAt = new Date().toISOString();
}

export function editDemoMessage(messageId: string, body: string): Message {
  const message = findMessage(messageId);
  if (!message) throw new Error('Demo message not found');
  message.body = body;
  message.editedAt = new Date().toISOString();
  return { ...message };
}

export function deleteDemoMessage(messageId: string): Message {
  const message = findMessage(messageId);
  if (!message) throw new Error('Demo message not found');
  message.isDeleted = true;
  message.deletedAt = new Date().toISOString();
  return { ...message };
}
