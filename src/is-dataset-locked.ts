import {
  sequence,
  startWith,
} from "https://deno.land/x/fns@1.1.1/string/regex.ts";
import { matches } from "https://deno.land/x/fns@1.1.1/string/string-type-guard.ts";

import { truenasCliViaSsh } from "./truenas-cli-via-ssh.ts";

export async function isDatasetLocked(
  datasetId: string,
  sshArgsAndUserAtHost: string[],
): Promise<boolean> {
  return (await truenasCliViaSsh(
    sshArgsAndUserAtHost,
    "storage dataset query id,locked",
  ))
    .split("\n")
    .some(matches(
      startWith(sequence(datasetId, ",true")),
    ));
}
