import { log, logNoTimestampNoNewline } from "./log.ts";
import { runViaSshTruenasCli } from "./run-via-ssh-truenas-cli.ts";

export async function unlockDataset(
  datasetId: string,
  passphrase: string,
  sshArgsAndUserAtHost: string[],
  force = false,
): Promise<void> {
  log(`Unlocking dataset "${datasetId}"...`);
  logNoTimestampNoNewline(
    await runViaSshTruenasCli(
      sshArgsAndUserAtHost,
      `storage dataset unlock id="${datasetId}" unlock_options={"recursive":true, "key_file":false, "force":${force}, "datasets":[{"name":"${datasetId}", "passphrase":"${passphrase}"}]}`,
    ),
  );
}
