import { getCurrentTime } from "./get-current-time.ts";

export function log(message = ""): void {
  console.error(`${getCurrentTime()} ${message}`);
}

export function logNoNewline(message = ""): void {
  Deno.stderr.writeSync(
    new TextEncoder().encode(`${getCurrentTime()} ${message}`),
  );
}

export function logNoTimestamp(message = ""): void {
  console.error(message);
}

export function logNoTimestampNoNewline(message = ""): void {
  Deno.stderr.writeSync(new TextEncoder().encode(message));
}
