export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    const message =
      body !== null &&
      typeof body === 'object' &&
      'error' in body &&
      body.error !== null &&
      typeof body.error === 'object' &&
      'message' in body.error &&
      typeof body.error.message === 'string'
        ? body.error.message
        : `Request failed (${res.status})`
    throw new Error(message)
  }
  return res.json() as Promise<T>
}
