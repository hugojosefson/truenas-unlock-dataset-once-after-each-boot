import { getDatasetMountpoint } from "./get-dataset-mountpoint.ts";
import { log, logNoTimestamp } from "./log.ts";
import { runViaSsh } from "./run-via-ssh.ts";

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
  const checkResult = await runViaSsh(
    sshArgsAndUserAtHost,
    `
  if [ -x "${unlockrcPath}" ]; then
    printf "executable"
  elif [ -f "${unlockrcPath}" ]; then
    printf "file"
  else
    printf "missing"
  fi`,
    true,
  ) as
    | "executable"
    | "file"
    | "missing";

  if (checkResult === "missing") {
    log(`No "${unlockrcPath}" found.`);
    return;
  }

  if (checkResult === "file") {
    log(`NOT executing non-executable "${unlockrcPath}"!`);
    return;
  }

  log(`Executing "${unlockrcPath}"...`);
  logNoTimestamp(
    await runViaSsh(
      sshArgsAndUserAtHost,
      unlockrcPath,
    ),
  );
}
