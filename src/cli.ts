#!/bin/sh
// 2>/dev/null;DENO_VERSION_RANGE="^1.42.1";DENO_RUN_ARGS="--allow-all";set -e;V="$DENO_VERSION_RANGE";A="$DENO_RUN_ARGS";h(){ [ -x "$(command -v "$1" 2>&1)" ];};g(){ u="$([ "$(id -u)" != 0 ]&&echo sudo||:)";if h brew;then echo "brew install $1";elif h apt;then echo "($u apt update && $u DEBIAN_FRONTEND=noninteractive apt install -y $1)";elif h yum;then echo "$u yum install -y $1";elif h pacman;then echo "$u pacman -yS --noconfirm $1";elif h opkg-install;then echo "$u opkg-install $1";fi;};p(){ q="$(g "$1")";if [ -z "$q" ];then echo "Please install '$1' manually, then try again.">&2;exit 1;fi;eval "o=\"\$(set +o)\";set -x;$q;set +x;eval \"\$o\"">&2;};f(){ h "$1"||p "$1";};w(){ [ -n "$1" ] && "$1" -V >/dev/null 2>&1;};U="$(l=$(printf "%s" "$V"|wc -c);for i in $(seq 1 $l);do c=$(printf "%s" "$V"|cut -c $i);printf '%%%02X' "'$c";done)";D="$(w "$(command -v deno||:)"||:)";t(){ i="$(if h findmnt;then findmnt -Ononoexec,noro -ttmpfs -nboAVAIL,TARGET|sort -rn|while IFS=$'\n\t ' read -r a m;do [ "$a" -ge 150000000 ]&&[ -d "$m" ]&&printf %s "$m"&&break||:;done;fi)";printf %s "${i:-"${TMPDIR:-/tmp}"}";};s(){ deno eval "import{satisfies as e}from'https://deno.land/x/semver@v1.4.1/mod.ts';Deno.exit(e(Deno.version.deno,'$V')?0:1);">/dev/null 2>&1;};e(){ R="$(t)/deno-range-$V/bin";mkdir -p "$R";export PATH="$R:$PATH";s&&return;f curl;v="$(curl -sSfL "https://semver-version.deno.dev/api/github/denoland/deno/$U")";i="$(t)/deno-$v";ln -sf "$i/bin/deno" "$R/deno";s && return;f unzip;([ "${A#*-q}" != "$A" ]&&exec 2>/dev/null;curl -fsSL https://deno.land/install.sh|DENO_INSTALL="$i" sh -s $DENO_INSTALL_ARGS "$v"|grep -iv discord>&2);};e;exec deno run $A "$0" "$@"
import { readAll } from "https://deno.land/std@0.221.0/io/read_all.ts";
import {
  sequence,
  startWith,
} from "https://deno.land/x/fns@1.1.1/string/regex.ts";
import { matches } from "https://deno.land/x/fns@1.1.1/string/string-type-guard.ts";
import { run } from "https://deno.land/x/run_simple@2.3.0/mod.ts";
import addSignalListener = Deno.addSignalListener;

const ISO_DATE_FORMAT_FOR_POSIX_DATE = "%Y-%m-%d %H:%M:%S";

/**
 * Get the current time as an ISO 8601 string, in the UTC timezone.
 */
export function getCurrentTime(): string {
  return new Date().toISOString()
    .replace("T", " ")
    .replace(/\..*$/, "");
}

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

export async function readPassphrase(datasetId: string): Promise<string> {
  if (Deno.stdin.isTerminal()) {
    let passphrase = "";
    while (passphrase.trim() === "") {
      passphrase = globalThis.prompt(
        `Enter passphrase to unlock dataset "${datasetId}":`,
      ) ?? "";
    }
    return passphrase;
  }
  return new TextDecoder().decode(await readAll(Deno.stdin)).trim();
}

export async function isDatasetLocked(
  datasetId: string,
  sshArgsAndUserAtHost: string[],
): Promise<boolean> {
  return (await run([
    "ssh",
    "-qt",
    ...sshArgsAndUserAtHost,
    "cli",
    "--mode=csv",
    "--command",
    `"storage dataset query id,locked"`,
  ]))
    .split("\n")
    .some(matches(
      startWith(sequence(datasetId, ",true")),
    ));
}

export async function unlockDataset(
  datasetId: string,
  passphrase: string,
  sshArgsAndUserAtHost: string[],
): Promise<void> {
  log(`Unlocking dataset "${datasetId}"...`);
  const result = await run([
    "ssh",
    "-qt",
    ...sshArgsAndUserAtHost,
    "sh",
  ], {
    stdin: `
      prefix_each_line_with_timestamp() {
        local line
        while IFS= read -r line; do
          printf "%s %s\\n" "\$(TZ=UTC date '+${ISO_DATE_FORMAT_FOR_POSIX_DATE}')" "\${line}" >&2
        done
      }

      cli --mode csv --command 'storage dataset unlock id=\"${datasetId}\" unlock_options={\"recursive\":true, \"key_file\":false, \"force\":false, \"datasets\":[{\"name\":\"${datasetId}\", \"passphrase\":\"${
      escapeSingleQuoteForShell(passphrase)
    }\"}]}' 2>&1 | prefix_each_line_with_timestamp
      `,
  });
  log(result);
}

export function escapeSingleQuoteForShell(s: string): string {
  return s.replace(/'/g, `'"'"'`);
}

export async function getDatasetMountpoint(
  datasetId: string,
  sshArgsAndUserAtHost: string[],
): Promise<string | never> {
  return (await run([
    "ssh",
    "-qt",
    ...sshArgsAndUserAtHost,
    "/usr/sbin/zfs",
    "get",
    "-o",
    "value",
    "-H",
    "mountpoint",
    datasetId,
  ]))
    .split("\n")
    .shift() ??
    await Promise.reject(
      new Error(`No mountpoint found for dataset "${datasetId}".`),
    );
}

export async function runAnyDotUnlockrcInDataset(
  datasetId: string,
  sshArgsAndUserAtHost: string[],
): Promise<void> {
  const mountpoint = await getDatasetMountpoint(
    datasetId,
    sshArgsAndUserAtHost,
  );
  log(`Dataset "${datasetId}" is mounted at "${mountpoint}".`);
  const unlockrcPath = `${mountpoint}/.unlockrc`;
  log(`Checking for "${unlockrcPath}"...`);
  const remoteCommand = `
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

  if [ -x "${unlockrcPath}" ]; then
    log 'Executing "${unlockrcPath}"...'
    "${unlockrcPath}" 2>&1 | prefix_each_line_with_timestamp "  "
    log 'Done with "${unlockrcPath}".'
  elif [ -f "${unlockrcPath}" ]; then
    log 'NOT executing non-executable "${unlockrcPath}"!'
  else
    log 'No "${unlockrcPath}" found.'
  fi
`;
  const result = await run([
    "ssh",
    "-q",
    ...sshArgsAndUserAtHost,
    "sh",
    "-c",
    remoteCommand,
  ]);
  logNoTimestamp(result);
}

export async function waitUntilPossibleShutdown(
  sshArgsAndUserAtHost: string[],
): Promise<void> {
  logNoTimestamp("");
  logNoNewline("Waiting for next boot...");
  await run([
    "ssh",
    "-q",
    ...sshArgsAndUserAtHost,
    "sleep",
    "infinity",
  ]).catch(() => {});
  logNoTimestamp(" Connection lost.");
}

export async function waitUntilSystemStateReady(
  sshArgsAndUserAtHost: string[],
): Promise<string> {
  const remoteCommand = `
    if [ "$(cli --interactive --command "system state")" = "READY" ]; then
      TZ=UTC uptime --since
    else
      exit 1
    fi
  `;
  logNoTimestamp("");
  logNoNewline("Waiting for the system to be READY...");
  let bootTime = "";
  while (bootTime === "") {
    bootTime = await run([
      "ssh",
      "-q",
      ...["-o", "ConnectTimeout=5"],
      ...["-o", "ServerAliveInterval=2"],
      ...sshArgsAndUserAtHost,
      remoteCommand,
    ]).catch(() => "");
    if (bootTime !== "") {
      logNoTimestamp(" READY!");
      break;
    }
    logNoTimestampNoNewline(".");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return bootTime;
}

export function getUsage(): string {
  return `
Usage: ${import.meta.filename} <dataset_id> <ssh_args_and_user_at_host>

Example: ${import.meta.filename} my-dataset "user@host"
`;
}

export async function main(args: string[]): Promise<void> {
  let keepGoing = true;

  addSignalListener("SIGINT", () => {
    logNoTimestamp();
    log("You pressed CTRL+C, so exiting.");
    keepGoing = false;
    Deno.exit(130);
  });

  if (args.some((a) => ["-h", "--help"].includes(a))) {
    console.log(getUsage());
    Deno.exit(0);
  }

  const [datasetId, ...sshArgsAndUserAtHost] = args;
  if (
    !datasetId || !sshArgsAndUserAtHost || sshArgsAndUserAtHost.length === 0
  ) {
    console.error(getUsage());
    Deno.exit(2);
  }

  const passphrase = await readPassphrase(datasetId);

  let bootTime: string;
  let unlockTime: string | undefined = undefined;
  while (keepGoing) {
    bootTime = await waitUntilSystemStateReady(sshArgsAndUserAtHost);
    if (await isDatasetLocked(datasetId, sshArgsAndUserAtHost)) {
      log(`Dataset "${datasetId}" is locked.`);
      log(
        `boot_time:   ${
          bootTime ?? "                     "
        } (when the server says it booted)`,
      );
      log(
        `unlock_time: ${
          unlockTime ?? "                   "
        } (when we know we unlocked, or found it already unlocked)`,
      );
      if (bootTime > (unlockTime ?? "0")) {
        log("boot_time is later than unlock_time, so we are on a new boot.");
        await unlockDataset(datasetId, passphrase, sshArgsAndUserAtHost);
        unlockTime = getCurrentTime();
        log(`unlock_time: ${unlockTime} (we unlocked, just now)`);
        await runAnyDotUnlockrcInDataset(datasetId, sshArgsAndUserAtHost);
      } else {
        log(
          "boot_time is before or equal to unlock_time, so we are still on the same boot. We assume still unlocked, or manually locked in which case we leave as-is.",
        );
        await waitUntilPossibleShutdown(sshArgsAndUserAtHost);
      }
    } else {
      if (!unlockTime) {
        log(
          `Dataset "${datasetId}" is already unlocked, handle as if we unlocked it.`,
        );
        unlockTime = getCurrentTime();
        await runAnyDotUnlockrcInDataset(datasetId, sshArgsAndUserAtHost);
      } else {
        log(`Dataset "${datasetId}" is still unlocked.`);
      }
      await waitUntilPossibleShutdown(sshArgsAndUserAtHost);
    }
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
