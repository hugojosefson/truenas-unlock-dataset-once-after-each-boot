import { run } from "https://deno.land/x/run_simple@2.3.0/src/run.ts";
import { quoteForShell } from "./escape-single-quote-for-shell.ts";
import { ISO_DATE_FORMAT_FOR_POSIX_DATE } from "./iso-date-format-for-posix-date.ts";

export async function runViaSsh(
  sshArgsAndUserAtHost: string[],
  command: string | string[],
  rawOutput = false,
): Promise<string> {
  const sshArgs = [
    "-q",
    ...["-o", "ConnectTimeout=5"],
    ...["-o", "ServerAliveInterval=2"],
  ];

  if (rawOutput) {
    return await run([
      "ssh",
      ...sshArgs,
      ...sshArgsAndUserAtHost,
      ...(typeof command === "string" ? ["sh", "-c", command] : command),
    ]);
  }

  return await run([
    "ssh",
    ...sshArgs,
    ...sshArgsAndUserAtHost,
    "sh",
  ], {
    stdin: `
      prefix_each_line_with_timestamp() {
    local extra_indent_after_timestamp
    extra_indent_after_timestamp="\${1:-""}"
        local line
        while IFS= read -r line; do
      printf "%s %s%s\\n" "\$(TZ=UTC date '+${ISO_DATE_FORMAT_FOR_POSIX_DATE}')" "\${extra_indent_after_timestamp}" "\${line}"
        done
      }

  log() {
    echo "\$*" | prefix_each_line_with_timestamp
  }

  (${
      (typeof command === "string" ? ["sh", "-c", command] : command)
        .map(quoteForShell)
        .join(" ")
    }) 2>&1 | prefix_each_line_with_timestamp "  "
      `,
  });
}
