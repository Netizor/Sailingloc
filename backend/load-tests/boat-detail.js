import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
// ID d'un bateau existant (tu peux le changer)
const BOAT_ID = __ENV.BOAT_ID || '223'

export default function () {
  const res = http.get(`${BASE_URL}/api/boats/${BOAT_ID}`)

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has id': (r) => {
      try {
        return r.json().id !== undefined
      } catch {
        return false
      }
    },
  })

  sleep(1)
}