import http from 'k6/http';
import { check, sleep } from 'k6';
import { vu } from 'k6/execution';

const baseUrl = __ENV.BASE_URL || 'http://host.docker.internal:8080';
const cardId = __ENV.CARD_ID || '0000419b-0bba-4488-8f7a-6194544ce91e';

export const options = {
  discardResponseBodies: true,
  stages: [
    { duration: '30s', target: 500 },
    { duration: '45s', target: 2000 },
    { duration: '45s', target: 5000 },
    { duration: '60s', target: 10000 },
    { duration: '60s', target: 10000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

function simulatedClientIp(id) {
  const group = Math.floor((id - 1) / 250);
  const host = ((id - 1) % 250) + 1;
  return `10.1.${group}.${host}`;
}

export default function () {
  const response = http.get(`${baseUrl}/api/v1/cards/id/${cardId}`, {
    headers: { 'X-Real-IP': simulatedClientIp(vu.idInTest) },
    tags: { endpoint: 'card_by_id', cache: 'warm' },
  });

  check(response, { 'card lookup returns 200': (r) => r.status === 200 });
  sleep(2);
}
