import type { ParseOptions } from "https://deno.land/std@0.222.1/csv/parse.ts";
import { quoteForShell } from "./escape-single-quote-for-shell.ts";
import { runViaSsh } from "./run-via-ssh.ts";
import { parsePart } from "https://raw.githubusercontent.com/hugojosefson/incus-app-container/12-jailmaker/src/incus-app-container-files/truenas/parse-part.ts";
import { parseCsv } from "https://raw.githubusercontent.com/hugojosefson/incus-app-container/12-jailmaker/src/incus-app-container-files/deps.ts";

export async function runViaSshTruenasCli(
  sshArgsAndUserAtHost: string[],
  command: string,
): Promise<string> {
  const response = await runViaSsh(
    sshArgsAndUserAtHost,
    [
      "cli",
      "--interactive",
      ...["--mode", "csv"],
      ...["--command", quoteForShell(command)],
    ],
    true,
  );
  return response;
}

export async function runViaSshTruenasCliParsed<
  T extends Record<string, unknown>,
  R = T[],
>(
  sshArgsAndUserAtHost: string[],
  command: string,
): Promise<R> {
  const output = await runViaSshTruenasCli(sshArgsAndUserAtHost, command);
  if (output === "") {
    return [] as R;
  }
  return parseCsv(output, { skipFirstRow: true } as ParseOptions).map(
    parsePart,
  ) as R;
}
