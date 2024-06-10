#!/bin/sh
// 2>/dev/null;DENO_VERSION_RANGE="^1.44.1";DENO_RUN_ARGS="--allow-all";set -e;V="$DENO_VERSION_RANGE";A="$DENO_RUN_ARGS";h(){ [ -x "$(command -v "$1" 2>&1)" ];};g(){ u="$([ "$(id -u)" != 0 ]&&echo sudo||:)";if h brew;then echo "brew install $1";elif h apt;then echo "($u apt update && $u DEBIAN_FRONTEND=noninteractive apt install -y $1)";elif h yum;then echo "$u yum install -y $1";elif h pacman;then echo "$u pacman -yS --noconfirm $1";elif h opkg-install;then echo "$u opkg-install $1";fi;};p(){ q="$(g "$1")";if [ -z "$q" ];then echo "Please install '$1' manually, then try again.">&2;exit 1;fi;eval "o=\"\$(set +o)\";set -x;$q;set +x;eval \"\$o\"">&2;};f(){ h "$1"||p "$1";};w(){ [ -n "$1" ] && "$1" -V >/dev/null 2>&1;};U="$(l=$(printf "%s" "$V"|wc -c);for i in $(seq 1 $l);do c=$(printf "%s" "$V"|cut -c $i);printf '%%%02X' "'$c";done)";D="$(w "$(command -v deno||:)"||:)";t(){ i="$(if h findmnt;then findmnt -Ononoexec,noro -ttmpfs -nboAVAIL,TARGET|sort -rn|while IFS=$'\n\t ' read -r a m;do [ "$a" -ge 150000000 ]&&[ -d "$m" ]&&printf %s "$m"&&break||:;done;fi)";printf %s "${i:-"${TMPDIR:-/tmp}"}";};s(){ deno eval "import{satisfies as e}from'https://deno.land/x/semver@v1.4.1/mod.ts';Deno.exit(e(Deno.version.deno,'$V')?0:1);">/dev/null 2>&1;};e(){ R="$(t)/deno-range-$V/bin";mkdir -p "$R";export PATH="$R:$PATH";s&&return;f curl;v="$(curl -sSfL "https://semver-version.deno.dev/api/github/denoland/deno/$U")";i="$(t)/deno-$v";ln -sf "$i/bin/deno" "$R/deno";s && return;f unzip;([ "${A#*-q}" != "$A" ]&&exec 2>/dev/null;curl -fsSL https://deno.land/install.sh|DENO_INSTALL="$i" sh -s $DENO_INSTALL_ARGS "$v"|grep -iv discord>&2);};e;exec deno run $A "$0" "$@"
import { parseArgs } from "jsr:@std/cli@0.224/parse-args";
import { getCurrentTime } from "./get-current-time.ts";
import { isDatasetLocked } from "./is-dataset-locked.ts";
import { log, logNoTimestamp } from "./log.ts";
import { readPassphraseToUnlockDataset } from "./read-passphrase-to-unlock-dataset.ts";
import { runAnyDotUnlockrcInDataset } from "./run-any-dot-unlockrc-in-dataset.ts";
import { unlockDataset } from "./unlock-dataset.ts";
import { waitUntilPossibleShutdown } from "./wait-until-possible-shutdown.ts";
import { waitUntilSystemStateReady } from "./wait-until-system-state-ready.ts";

export function getUsage(): string {
  return `
Usage: ${import.meta.filename} [-f | --force] <dataset_id> <ssh_args_and_user_at_host>

Example: ${import.meta.filename} my-dataset "user@host"
`;
}

export async function main(rawArgs: string[]): Promise<void> {
  let keepGoing = true;

  Deno.addSignalListener("SIGINT", () => {
    logNoTimestamp();
    log("You pressed CTRL+C, so exiting.");
    keepGoing = false;
    Deno.exit(130);
  });

  const args = parseArgs(rawArgs, {
    boolean: ["force", "help"],
    string: ["_"],
    collect: ["_"],
    alias: {
      f: "force",
      h: "help",
    },
  });

  if (args.help) {
    console.log(getUsage());
    Deno.exit(0);
  }

  const [datasetId, ...sshArgsAndUserAtHost] = args._;
  if (
    !datasetId || !sshArgsAndUserAtHost || sshArgsAndUserAtHost.length === 0
  ) {
    console.error(getUsage());
    Deno.exit(2);
  }

  const passphrase = await readPassphraseToUnlockDataset(datasetId);

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
        await unlockDataset(
          datasetId,
          passphrase,
          sshArgsAndUserAtHost,
          args.force,
        );
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
