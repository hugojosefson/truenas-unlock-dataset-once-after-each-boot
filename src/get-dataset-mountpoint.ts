import { runViaSsh } from "./run-via-ssh.ts";

export async function getDatasetMountpoint(
  datasetId: string,
  sshArgsAndUserAtHost: string[],
): Promise<string | never> {
  return (await runViaSsh(
    sshArgsAndUserAtHost,
    ["/usr/sbin/zfs", "get", "-o", "value", "-H", "mountpoint", datasetId],
    true,
  ))
    .split("\n")
    .shift() ??
    await Promise.reject(
      new Error(`No mountpoint found for dataset "${datasetId}".`),
    );
}
