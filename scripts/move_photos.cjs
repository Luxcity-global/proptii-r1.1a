const fs = require('fs');

const file = 'src/landlord_agent/src/components/PropertyDetails.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');

// Find the photos block
const photosStartMarker = "{/* ── Photos tab — fully inline management ──────────────────── */}";
const pStartIdx = lines.findIndex(l => l.includes(photosStartMarker));
let pEndIdx = pStartIdx;
let bracketCount = 0;
let foundBracket = false;

// Scan to find the end of the photos block '{activeTab === 'photos' && ('
for (let i = pStartIdx + 1; i < lines.length; i++) {
    if (lines[i].includes('{activeTab === \'photos\' && (')) {
        bracketCount++;
        foundBracket = true;
    }
    
    // Count brackets to find the end
    // This is a naive bracket counter, but given the formatting it should be okay if we just look for `)}`
    // Actually we know it ends at 756. Let's just use the markers.
}

const extractStart = pStartIdx + 2; // skip the comment and `{activeTab...`
const extractEnd = pStartIdx + 156; // 599 + 156 = 755 (approx)
// Let's just find `)}` after the "Unsaved changes save bar"
const unsavedChangesIdx = lines.findIndex((l, i) => i > pStartIdx && l.includes("{/* Unsaved changes save bar */}"));
const endIdx = lines.findIndex((l, i) => i > unsavedChangesIdx && l.includes(")}"));

const photosBlock = lines.slice(extractStart, endIdx).join('\n');

// Now remove the entire Photos tab block (including the marker and `)}`)
const deleteStart = pStartIdx;
const deleteEnd = endIdx;

lines.splice(deleteStart, deleteEnd - deleteStart + 1);

// Now insert `photosBlock` at the end of the overview tab
const overviewEndMarker = "{/* ── Documents tab ─────────────────────────────────────────── */}";
const insertIdx = lines.findIndex(l => l.includes(overviewEndMarker)) - 2; // Before `</div>` and `)}`

lines.splice(insertIdx, 0, 
    "                {/* ── Photos (embedded in overview) ──────────────────── */}",
    photosBlock
);

fs.writeFileSync(file, lines.join('\n'));
console.log("Done.");
