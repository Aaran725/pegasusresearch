// Client for the server-backed watchlist (server/services/portfolioStore.js).
// Deliberately backend-persisted rather than localStorage, so the same
// portfolio shows up regardless of which browser/device hits this server.

export async function fetchPortfolio() {
  const res = await fetch('/api/portfolio');
  if (!res.ok) throw new Error(`Portfolio request failed (${res.status})`);
  const body = await res.json();
  return body.items ?? [];
}

export async function addToPortfolio(snapshot) {
  const res = await fetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
  if (!res.ok) throw new Error(`Add to portfolio failed (${res.status})`);
  const body = await res.json();
  return body.items ?? [];
}

export async function removeFromPortfolio(name) {
  const res = await fetch(`/api/portfolio/${encodeURIComponent(name)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Remove from portfolio failed (${res.status})`);
  const body = await res.json();
  return body.items ?? [];
}
