const BASE = '/calls';

export async function fetchCalls(agent = '') {
  const url = agent ? `${BASE}?agent=${encodeURIComponent(agent)}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch calls: ${res.status}`);
  return res.json();
}

export async function fetchCall(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(`Call not found: ${res.status}`);
  return res.json();
}

export async function fetchMoments(id) {
  const res = await fetch(`${BASE}/${id}/moments`);
  if (!res.ok) throw new Error(`Failed to fetch moments: ${res.status}`);
  return res.json();
}

export async function ingestCall(body) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function deleteCall(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
