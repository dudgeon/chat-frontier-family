export async function waitForCompletion(
  fetchFn: typeof fetch,
  url: string,
  headers: HeadersInit,
  attempts = 30,
  delayMs = 1000,
) {
  let data: any;
  for (let i = 0; i < attempts; i++) {
    const res = await fetchFn(url, { headers });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    data = await res.json();
    if (data.status === 'completed') break;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  if (!data || data.status !== 'completed') {
    throw new Error('timeout');
  }
  return data;
}
