// k6 smoke perf — 1 VU, fast, thresholds decide pass/fail. Run with: k6 run perf/checkout.smoke.ts
// (k6 is a separate binary, not an npm dep; v0.57+ runs TS natively. See references/performance.md.)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function (): void {
  const base = __ENV.BASE_URL ?? 'https://app.test';
  const res = http.get(`${base}/health`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
