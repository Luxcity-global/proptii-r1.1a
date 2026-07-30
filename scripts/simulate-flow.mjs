import axios from 'axios';
import chalk from 'chalk';

const API_URL = 'http://localhost:3000/api';

async function simulateFlow() {
  console.log(chalk.blue('🚀 Starting E2E Flow Simulation...\n'));
  
  try {
    // 1. Check API Health
    console.log(chalk.yellow('1. Checking Backend Health...'));
    try {
      const res = await axios.get(`${API_URL}/health`, { timeout: 3000 });
      console.log(chalk.green(`   ✅ Backend is up: ${res.data.status || 'OK'} (${res.status})`));
    } catch (e) {
      console.log(chalk.yellow(`   ⚠️ /health not found or failed, trying /api...`));
      await axios.get(`${API_URL}`, { timeout: 3000 }).catch(() => {});
    }

    // 2. Try fetching properties (Public Endpoint)
    console.log(chalk.yellow('\n2. Fetching Properties (Public)...'));
    try {
      const propertiesRes = await axios.post(`${API_URL}/search`, { query: 'London', type: 'properties' });
      console.log(chalk.green(`   ✅ Successfully fetched properties: ${propertiesRes.data?.results?.length || propertiesRes.data.length || 0} found.`));
    } catch (e) {
      console.log(chalk.red(`   ❌ Failed to fetch properties: ${e.message}`));
      if (e.response) console.log(chalk.red(`      Status: ${e.response.status} - ${JSON.stringify(e.response.data)}`));
    }

    // 3. Try hitting a protected endpoint without auth
    console.log(chalk.yellow('\n3. Testing Auth Protection...'));
    try {
      await axios.post(`${API_URL}/native-properties`, { title: 'Test Property' });
      console.log(chalk.red('   ❌ Security failure: Allowed property creation without auth token!'));
    } catch (e) {
      if (e.response && (e.response.status === 401 || e.response.status === 403)) {
        console.log(chalk.green(`   ✅ Security works: Blocked unauthorized request (${e.response.status})`));
      } else {
        console.log(chalk.red(`   ❌ Unexpected error on auth check: ${e.message}`));
      }
    }
    
    // 4. Try Stripe Checkout init (to see if the placeholder fix worked)
    console.log(chalk.yellow('\n4. Testing Billing Initialization (with placeholders)...'));
    try {
      // Simulate frontend checkout request
      await axios.post(`${API_URL}/billing/checkout`, {}, {
        headers: { Authorization: 'Bearer FAKE_TOKEN' }
      });
    } catch (e) {
      if (e.response && e.response.status === 401) {
        console.log(chalk.green('   ✅ Auth caught the fake token before Stripe could crash!'));
      } else if (e.response && e.response.status >= 500) {
        console.log(chalk.red(`   ❌ Backend crashed on billing route: ${e.response.data?.message || e.message}`));
      } else {
        console.log(chalk.green(`   ✅ Backend returned clean error: ${e.response?.status} - ${e.response?.data?.message || e.message}`));
      }
    }

    console.log(chalk.blue('\n🎉 Simulation Complete!'));
    
  } catch (err) {
    console.error(chalk.red('\n💥 Fatal Error during simulation:'), err.message);
  }
}

simulateFlow();
