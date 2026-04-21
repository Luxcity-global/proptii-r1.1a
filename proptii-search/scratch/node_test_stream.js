const { request } = require('http');

const req = request({
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/v1/search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  }
}, res => {
  res.setEncoding('utf8');
  res.on('data', chunk => {
    console.log("--> CHUNK RECEIVED:");
    console.log(chunk);
  });
  res.on('end', () => console.log('--> STREAM ENDED'));
});

req.write(JSON.stringify({ query: '2 bedroom flats for sale in London under £500k', filters: {} }));
req.end();
