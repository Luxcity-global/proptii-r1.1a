const url = 'http://127.0.0.1:3001/api/v1/search';

async function run() {
  console.log("Fetching...");
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '3 bedroom houses for sale in Manchester under 400k', filters: {} })
    });
    
    console.log("Fetch started! Status:", res.status);
    
    const decoder = new TextDecoder();
    for await (const chunk of res.body) {
      console.log("CHUNK:", decoder.decode(chunk));
    }
    console.log("Stream ended NATURALLY!");
  } catch (e) {
    console.log("Stream ERROR!", e);
  }
}
run();
