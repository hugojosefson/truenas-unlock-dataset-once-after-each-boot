import { logNoNewline, logNoTimestamp } from "./log.ts";
import { runViaSsh } from "./run-via-ssh.ts";

export async function waitUntilPossibleShutdown(
  sshArgsAndUserAtHost: string[],
): Promise<void> {
  logNoTimestamp("");
  logNoNewline("Waiting for next boot...");
  await runViaSsh(
    sshArgsAndUserAtHost,
    "sleep infinity",
  ).catch(() => {
  });
  logNoTimestamp(" Connection lost.");
}
