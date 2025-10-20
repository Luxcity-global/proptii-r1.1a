const http = require('http');

function testHealthEndpoint(port = 3002) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/health',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          console.log(`Status: ${res.statusCode}`);
          console.log(`Headers:`, res.headers);
          console.log(`Response: ${data}`);
          
          if (res.statusCode === 200) {
            try {
              const jsonData = JSON.parse(data);
              console.log('✅ Backend health check passed!');
              console.log('Service:', jsonData.service);
              console.log('Status:', jsonData.status);
              console.log('Timestamp:', jsonData.timestamp);
              resolve(jsonData);
            } catch (parseError) {
              console.log('⚠️ Response received but not JSON:', data.substring(0, 100) + '...');
              resolve({ status: 'non-json-response', data: data });
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ Connection failed: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testBackend() {
  console.log('🔍 Testing backend health endpoint...');
  
  try {
    await testHealthEndpoint(3003);
  } catch (error) {
    console.log('Port 3003 failed, trying 3002...');
    try {
      await testHealthEndpoint(3002);
    } catch (error2) {
      console.log('Port 3002 failed, trying 3001...');
      try {
        await testHealthEndpoint(3001);
      } catch (error3) {
        console.log('Port 3001 also failed, trying 3000...');
        try {
          await testHealthEndpoint(3000);
        } catch (error4) {
          console.error('❌ Backend is not running on any common port (3000, 3001, 3002, 3003)');
          console.error('Please start the backend server first with: npm run dev');
        }
      }
    }
  }
}

testBackend();
