import { quoteForShell } from "./escape-single-quote-for-shell.ts";
import { runViaSsh } from "./run-via-ssh.ts";

export async function truenasCliViaSsh(
  sshArgsAndUserAtHost: string[],
  command: string,
): Promise<string> {
  return await runViaSsh(
    sshArgsAndUserAtHost,
    [
      "cli",
      "--interactive",
      ...["--mode", "csv"],
      ...["--command", quoteForShell(command)],
    ],
    true,
  );
}
