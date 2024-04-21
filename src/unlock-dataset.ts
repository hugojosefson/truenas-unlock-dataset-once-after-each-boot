import { log, logNoTimestampNoNewline } from "./log.ts";
import { truenasCliViaSsh } from "./truenas-cli-via-ssh.ts";

export async function unlockDataset(
  datasetId: string,
  passphrase: string,
  sshArgsAndUserAtHost: string[],
): Promise<void> {
  log(`Unlocking dataset "${datasetId}"...`);
  logNoTimestampNoNewline(
    await truenasCliViaSsh(
      sshArgsAndUserAtHost,
      `storage dataset unlock id="${datasetId}" unlock_options={"recursive":true, "key_file":false, "force":false, "datasets":[{"name":"${datasetId}", "passphrase":"${passphrase}"}]}`,
    ),
  );
}
