export function getApiErrorMessage(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { message?: unknown; detail?: unknown } } } | null)?.response;
  const message = response?.data?.message ?? response?.data?.detail;
  if (typeof message === 'string' && message.trim()) {
    if (/Validation failed|default message \[/i.test(message)) return 'Please check the information you entered.';
    if (!/<!doctype|<html|https?:\/\/|exception|SQLState|JDBC|stack trace/i.test(message)) return message.trim();
  }
  if (!response) return 'Unable to connect. Please try again.';
  if (response.status === 401) return 'Please sign in again.';
  if (response.status === 403) return 'You do not have permission for this action.';
  if (response.status === 429) return 'Too many requests. Please wait a moment.';
  return 'Unable to complete this request. Please try again.';
}
