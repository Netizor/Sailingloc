import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '10s', target: 5 },  // monte doucement
    { duration: '20s', target: 5 },  // reste stable
    { duration: '10s', target: 0 },  // redescend
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],           // < 1% d'erreurs
    http_req_duration: ['p(95)<2000'],        // 95% < 2s
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  const res = http.get(`${BASE_URL}/api/boats`)

  check(res, {
    'status is 200': (r) => r.status === 200,
  })

  sleep(1)
}