import * as fs from 'fs';
import { parseRightmoveListings } from './rightmoveScraper';

const HTML_FILE = './src/rightmove-listing-sample.html';

function main() {
  if (!fs.existsSync(HTML_FILE)) {
    console.error(`Sample HTML file not found: ${HTML_FILE}`);
    process.exit(1);
  }
  const html = fs.readFileSync(HTML_FILE, 'utf-8');
  const properties = parseRightmoveListings(html);
  console.log(`Extracted ${properties.length} properties:`);
  properties.slice(0, 5).forEach((prop, i) => {
    console.log(`\nProperty #${i + 1}`);
    console.log(JSON.stringify(prop, null, 2));
  });
}

if (require.main === module) {
  main();
} 