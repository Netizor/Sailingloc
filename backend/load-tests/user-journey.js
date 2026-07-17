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

export default function () {
  // 1) Liste des bateaux
  const listRes = http.get(`${BASE_URL}/api/boats`)
  check(listRes, {
    'list status 200': (r) => r.status === 200,
  })

  let boatId = null
  try {
    const body = listRes.json()
    boatId = body?.data?.[0]?.id
  } catch {
    boatId = null
  }

  check(null, {
    'list has at least 1 boat': () => boatId !== null && boatId !== undefined,
  })

  if (!boatId) {
    sleep(1)
    return
  }

  sleep(0.5)

  // 2) Détail du premier bateau
  const detailRes = http.get(`${BASE_URL}/api/boats/${boatId}`)
  check(detailRes, {
    'detail status 200': (r) => r.status === 200,
  })

  sleep(1)
}