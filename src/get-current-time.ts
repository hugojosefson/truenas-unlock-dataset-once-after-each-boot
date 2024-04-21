/**
 * Get the current time as an ISO 8601 string, in the UTC timezone.
 */
export function getCurrentTime(): string {
  return new Date().toISOString()
    .replace("T", " ")
    .replace(/\..*$/, "");
}
