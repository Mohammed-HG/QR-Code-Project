export async function request(url, { signal, method = 'GET', body, csrfToken } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException('The request timed out. Please try again.', 'TimeoutError')), 20000);
  try {
    const response = await fetch(url, {
      method, credentials: 'same-origin', signal: controller.signal,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.error || 'The service is unavailable. Please try again.');
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return null;
    return response.headers.get('content-type')?.includes('image/png') ? response.blob() : response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
