import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const VUS = parseInt(__ENV.VUS) || 10
const DURATION = __ENV.DURATION || '30s'

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
}

export default function () {
  const res = http.get(`${BASE_URL}/api/boats?page=1&limit=12`)
  check(res, {
    'statut 200': (r) => r.status === 200,
    'reponse < 2s': (r) => r.timings.duration < 2000,
  })
  sleep(1)
}