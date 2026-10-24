/** Pull a short message from Spring Boot / axios errors. */
export function getApiErrorMessage(error: unknown, fallback = 'Try again'): string {
  const e = error as {
    message?: string;
    response?: { data?: { message?: string; detail?: string; title?: string } };
  };
  const data = e?.response?.data;
  const raw = data?.detail || data?.message || e?.message || '';
  if (!raw) return fallback;

  const fieldMsg = [...String(raw).matchAll(/default message \[([^\]]+)\]/g)].map((m) => m[1]);
  const useful = fieldMsg.filter((m) => !m.includes('.') && m !== 'email' && m !== 'password' && m !== 'loginRequest');
  if (useful.length) return useful[useful.length - 1];

  if (String(raw).includes('Validation failed')) return 'Email and password are required';
  return String(raw);
}
