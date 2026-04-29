import { normalizePhone } from './src/utils/phone';

const properties = [
  { id: '1', url: '/p1', agent: { name: 'Agent 1' } }, // No phone key at all
  { id: '2', url: '/p2', agent: { name: 'Agent 2', phone: null } }, // Explicit null
  { id: '3', url: '/p3', agent: { name: 'Agent 3', phone: '07123456789' } }, // UK Mobile
  { id: '4', url: '/p4', agent: { name: 'Agent 4', phone: '+353871234567' } }, // Irish +353
  { id: '5', url: '/p5', agent: { name: 'Agent 5', phone: 'invalid' } } // Invalid
];

console.log("--- BEFORE NORMALIZATION ---");
console.log(JSON.stringify(properties, null, 2));

const normalized = properties.map(p => {
  p.agent = p.agent || {};
  p.agent.phone = normalizePhone(p.agent.phone as any, p.id);
  return p;
});

console.log("\n--- AFTER NORMALIZATION (API RESPONSE SHAPE) ---");
console.log(JSON.stringify(normalized, null, 2));
