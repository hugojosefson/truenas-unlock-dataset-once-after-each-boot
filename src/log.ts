import { getCurrentTime } from "./get-current-time.ts";

export function timestampMessage(message = ""): string {
  const timestampedMessages = message
    .split("\n")
    .map((m) => `${getCurrentTime()} ${m}`);
  return timestampedMessages.join("\n");
}

export function log(message = ""): void {
  console.error(timestampMessage(message));
}

export function logNoNewline(message = ""): void {
  logNoTimestampNoNewline(timestampMessage(message));
}

export function logNoTimestamp(message = ""): void {
  console.error(message);
}

export function logNoTimestampNoNewline(message = ""): void {
  Deno.stderr.writeSync(new TextEncoder().encode(message));
}
