import {
  sequence,
  startWith,
} from "https://deno.land/x/fns@2.0.1/string/regex.ts";
import { matches } from "https://deno.land/x/fns@2.0.1/string/string-type-guard.ts";

import { runViaSshTruenasCli } from "./run-via-ssh-truenas-cli.ts";

export async function isDatasetLocked(
  datasetId: string,
  sshArgsAndUserAtHost: string[],
): Promise<boolean> {
  return (await runViaSshTruenasCli(
    sshArgsAndUserAtHost,
    "storage dataset query id,locked",
  ))
    .split("\n")
    .some(matches(
      startWith(sequence(datasetId, ",true")),
    ));
}
