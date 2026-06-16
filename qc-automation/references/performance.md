# k6 Performance Rules

How to write and gate k6 performance tests in TypeScript.

## Five test types, each with a purpose

**Principle:** Pick the type by the question you're answering. Write k6 in TS and define ramp profiles per type.
**Why:** Each type stresses a different failure mode; running the wrong one answers the wrong question.

| Type | Profile | Answers |
|------|---------|---------|
| smoke | 1 VU, short | Does the script work and the system respond at all? |
| load | ramp → 100 VU | Behavior under expected normal traffic. |
| stress | ramp → 400 VU | Where does it degrade/break above normal? |
| spike | jump → 500 VU | Survival of a sudden surge and recovery after. |
| soak | 50 VU sustained (hours) | Memory leaks / resource exhaustion over time. |

```ts
// scenarios with per-scenario thresholds
import http from 'k6/http';
import { Trend, Rate } from 'k6/metrics';

export const options = {
  scenarios: {
    load:  { executor: 'ramping-vus', stages: [{ duration: '2m', target: 100 }, { duration: '5m', target: 100 }, { duration: '1m', target: 0 }] },
    spike: { executor: 'ramping-vus', startTime: '8m', stages: [{ duration: '10s', target: 500 }, { duration: '1m', target: 0 }] },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    'http_req_duration{scenario:spike}': ['p(95)<1500'], // looser for spike
  },
};
```

## Thresholds in code define pass/fail

**Principle:** Pass/fail is decided by `thresholds`, not eyeballing. Use scenario-based options with per-scenario thresholds, and custom metrics (`Trend`/`Rate`/`Counter`/`Gauge`) for business-level checks.
**Why:** Codified thresholds make perf runs binary and CI-gateable; custom metrics measure what users feel (e.g. checkout latency), not just HTTP averages.

```ts
const checkoutTime = new Trend('checkout_time', true);
const checkoutErrors = new Rate('checkout_errors');

export default function () {
  const res = http.post(`${__ENV.BASE_URL}/checkout`, payload);
  checkoutTime.add(res.timings.duration);
  checkoutErrors.add(res.status !== 200);
}
// add to options.thresholds: checkout_time: ['p(95)<800'], checkout_errors: ['rate<0.02']
```

## CI vs dedicated perf runs

**Principle:** CI runs **smoke perf only** (1 VU, fast). Large load/stress/spike/soak run in a dedicated pre-release environment. Perf thresholds **warn**, they do not auto-block deploy. Cadence: run the heavy suite 2–3×/week in staging. **Never stress-test production.**
**Why:** Heavy perf is slow and noisy in CI; perf regressions need human judgment, not an auto-block; stressing prod harms real users.

```bash
# CI step — smoke perf only, non-blocking gate
k6 run --vus 1 --duration 30s perf/checkout.smoke.ts || echo "::warning::perf smoke regressed"
```

## Realistic data & environments

**Principle:** Use realistic data sets and ramp profiles that mirror production traffic shape. Never run meaningful load against a shared environment.
**Why:** Toy data and flat profiles give misleading numbers; load on a shared env corrupts other teams' results and may trip rate limits.

```ts
import { SharedArray } from 'k6/data';
const users = new SharedArray('users', () => JSON.parse(open('./data/users.json'))); // realistic, varied
```
