import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '30s', target: 60 },
    { duration: '30s', target: 120 },
    { duration: '30s', target: 200 },
  ],
  // pas de seuil bloquant : l'objectif est justement d'observer la dégradation
}

export default function () {
  const res = http.get(`${BASE_URL}/api/health`)
  check(res, { 'service disponible': (r) => r.status === 200 })
  sleep(0.5)
}