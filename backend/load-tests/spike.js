import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export const options = {
  stages: [
    { duration: '20s', target: 10 },   // trafic nominal
    { duration: '15s', target: 80 },   // pic brutal (affluence estivale)
    { duration: '30s', target: 80 },
    { duration: '20s', target: 10 },   // retour au nominal
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
}

export default function () {
  const search = http.get(`${BASE_URL}/api/boats?city=Marseille&type=SAILBOAT`)
  check(search, { 'recherche OK': (r) => r.status === 200 })

  const list = JSON.parse(search.body)
  if (list.data && list.data.length > 0) {
    const id = list.data[0].id
    const detail = http.get(`${BASE_URL}/api/boats/${id}`)
    check(detail, { 'fiche bateau OK': (r) => r.status === 200 })
  }
  sleep(1)
}