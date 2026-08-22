"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var phone_1 = require("./src/utils/phone");
var properties = [
    { id: '1', url: '/p1', agent: { name: 'Agent 1' } },
    { id: '2', url: '/p2', agent: { name: 'Agent 2', phone: null } },
    { id: '3', url: '/p3', agent: { name: 'Agent 3', phone: '07123456789' } },
    { id: '4', url: '/p4', agent: { name: 'Agent 4', phone: '+353871234567' } },
    { id: '5', url: '/p5', agent: { name: 'Agent 5', phone: 'invalid' } } // Invalid
];
console.log("--- BEFORE NORMALIZATION ---");
console.log(JSON.stringify(properties, null, 2));
var normalized = properties.map(function (p) {
    p.agent = p.agent || {};
    p.agent.phone = (0, phone_1.normalizePhone)(p.agent.phone, p.id);
    return p;
});
console.log("\n--- AFTER NORMALIZATION (API RESPONSE SHAPE) ---");
console.log(JSON.stringify(normalized, null, 2));
