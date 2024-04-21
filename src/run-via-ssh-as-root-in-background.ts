import {
  runViaSshTruenasCli,
  runViaSshTruenasCliParsed,
} from "./run-via-ssh-truenas-cli.ts";

export async function getExistingCronJobId(
  sshArgsAndUserAtHost: string[],
  command: string,
): Promise<number | undefined> {
  const { id } = (await runViaSshTruenasCliParsed<{ id: number }>(
    sshArgsAndUserAtHost,
    `task cron_job query id WHERE command=="${command}"`,
  ))[0] ?? {};
  return id;
}

export async function createOrFindCronJob(
  sshArgsAndUserAtHost: string[],
  command: string,
): Promise<number> {
  const existingCronJobId = await getExistingCronJobId(
    sshArgsAndUserAtHost,
    command,
  );
  if (existingCronJobId !== undefined) {
    return existingCronJobId;
  }
  await runViaSshTruenasCli(
    sshArgsAndUserAtHost,
    `task cron_job create enabled=false user=root command="${command}" description="by truenas-unlock-dataset-once-after-each-boot"`,
  );
  return await getExistingCronJobId(sshArgsAndUserAtHost, command) ??
    await Promise.reject(
      new Error(`Failed to create cron job for command "${command}".`),
    );
}

export async function runViaSshAsRootInBackground(
  sshArgsAndUserAtHost: string[],
  command: string,
): Promise<string> {
  const cronJobId: number = await createOrFindCronJob(
    sshArgsAndUserAtHost,
    command,
  );
  return await runViaSshTruenasCli(
    sshArgsAndUserAtHost,
    `task cron_job run id=${cronJobId}`,
  );
}

if (import.meta.main) {
  const [command, ...sshArgsAndUserAtHost] = Deno.args;
  console.log(await runViaSshAsRootInBackground(sshArgsAndUserAtHost, command));
}
