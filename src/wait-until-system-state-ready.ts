import {
  logNoNewline,
  logNoTimestamp,
  logNoTimestampNoNewline,
} from "./log.ts";
import { runViaSsh } from "./run-via-ssh.ts";

export async function waitUntilSystemStateReady(
  sshArgsAndUserAtHost: string[],
): Promise<string> {
  logNoTimestamp("");
  logNoNewline("Waiting for the system to be READY...");
  let bootTime = "";
  while (bootTime === "") {
    bootTime = await runViaSsh(
      sshArgsAndUserAtHost,
      `
    if [ "$(cli --interactive --command "system state")" = "READY" ]; then
      TZ=UTC uptime --since
    else
      exit 1
    fi
  `,
      true,
    ).catch(() => "");
    if (bootTime !== "") {
      logNoTimestamp(" READY!");
      break;
    }
    logNoTimestampNoNewline(".");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return bootTime;
}
