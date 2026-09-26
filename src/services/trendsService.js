// Client for /api/trends — aggregates computed from this app's own research
// cache (sectors researched, stages, valuations found). This is real data
// about what's been researched, not an external market-data feed; there is
// no such feed wired up, and the UI says so.

export async function fetchTrends() {
  const res = await fetch('/api/trends');
  if (!res.ok) throw new Error(`Trends request failed (${res.status})`);
  return res.json();
}
