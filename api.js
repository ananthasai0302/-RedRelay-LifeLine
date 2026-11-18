// thin fetch wrapper: throws an Error whose .fields holds per-field messages
export async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.error || 'Something went wrong');
    e.fields = data.errors || {};
    throw e;
  }
  return data;
}
