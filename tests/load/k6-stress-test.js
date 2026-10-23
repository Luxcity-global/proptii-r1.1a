import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const searchTrend = new Trend('property_search_duration');
const reportQueueTrend = new Trend('report_queue_duration');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm-up ramp
    { duration: '1m', target: 200 },   // Normal peak load
    { duration: '30s', target: 500 },   // Stress spike test
    { duration: '30s', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    error_rate: ['rate<0.01'], // <1% errors acceptable
    property_search_duration: ['p(95)<300'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3002';

export default function () {
  // Scenario 1: Health probe
  group('Health Status', () => {
    const res = http.get(`${BASE_URL}/api/health`);
    const passed = check(res, {
      'health is 200': (r) => r.status === 200,
      'has correlation id': (r) => r.headers['X-Correlation-Id'] !== undefined,
    });
    errorRate.add(!passed);
  });

  sleep(0.2);

  // Scenario 2: Paginated Property Search (Indexed)
  group('Property Search with Cursor', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/properties/search?limit=5`);
    searchTrend.add(Date.now() - start);

    const passed = check(res, {
      'search is 200': (r) => r.status === 200,
      'returns properties array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.items);
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!passed);
  });

  sleep(0.3);

  // Scenario 3: Asynchronous Report Generation Queue
  group('Report Generation Queue', () => {
    const payload = JSON.stringify({
      propertyId: 'prop-stress-test-1',
      uprn: '100023334455',
    });
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/properties/report/queue`, payload, params);
    reportQueueTrend.add(Date.now() - start);

    const passed = check(res, {
      'report queued is 202': (r) => r.status === 202,
    });
    errorRate.add(!passed);
  });

  sleep(0.5);
}
