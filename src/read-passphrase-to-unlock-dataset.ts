import { readAll } from "https://deno.land/std@0.224.0/io/read_all.ts";

export async function readPassphraseToUnlockDataset(
  datasetId: string,
): Promise<string> {
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
