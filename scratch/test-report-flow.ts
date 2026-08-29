import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  /* ignore */
}

import { REPORT_BACKEND_STAGING_URL, parseStreamingReportLine, mergeStreamingReportChunk } from '../src/services/propertyReportStreamService';
import { mapStreamingReportToPropertyReport } from '../src/utils/streamingReportMapper';

async function testLive() {
  console.log('Targeting backend URL:', REPORT_BACKEND_STAGING_URL);
  const payload = {
    listingId: 'https://www.onthemarket.com/details/20223142/',
    address: {
      display: 'Lindsay Road, Bristol BS7 9NP',
      street: 'Lindsay Road',
      postcode: 'BS7 9NP',
      coordinates: { lat: 51.4804826, lng: -2.5698842 }
    },
    listingPrice: '£2,150 pcm'
  };
  
  console.log('Dispatching request to:', `${REPORT_BACKEND_STAGING_URL}/api/properties/report`);
  const res = await fetch(`${REPORT_BACKEND_STAGING_URL}/api/properties/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/x-ndjson' },
    body: JSON.stringify(payload)
  });
  
  console.log('HTTP Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let reportData: any = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const frame = parseStreamingReportLine(line);
      if (!frame) continue;
      console.log(`[Stream Frame] Received: ${frame.type}${frame.type === 'chunk' ? ` (module: ${(frame as any).module})` : ''}`);
      if (frame.type === 'initial') {
        reportData = frame.data;
      } else if (frame.type === 'chunk' && reportData) {
        reportData = mergeStreamingReportChunk(reportData, frame as any);
      }
    }
  }

  const mapped = mapStreamingReportToPropertyReport(reportData, 'tenant', {
    listingPrice: '£2,150 pcm',
    addressLabel: payload.address.display
  });

  console.log('\n================ VERIFICATION RESULTS ================');
  console.log('1. Part A Financial & Bills Breakdown:');
  console.log(JSON.stringify(mapped.renter?.partARows, null, 2));

  console.log('\n2. Part B Utilities & EPC Details:');
  console.log(mapped.renter?.partBBody);

  console.log('\n3. Local Area Intelligence:');
  mapped.renter?.localArea?.forEach(item => {
    console.log(`  - [${item.status}] ${item.title}: ${item.finding}`);
  });

  console.log('\n4. Recommended Action Steps:');
  mapped.renter?.steps?.forEach((step, idx) => console.log(`  ${idx + 1}. ${step}`));
  console.log('======================================================');
}

testLive().catch(err => {
  console.error('Error during test:', err);
});
