const calls = new Map();

export function saveCall(id, data) {
  calls.set(id, data);
}

export function getCall(id) {
  return calls.get(id) ?? null;
}

export function getAllCalls() {
  return [...calls.values()];
}

export function callExists(id) {
  return calls.has(id);
}

export function deleteCall(id) {
  return calls.delete(id);
}
