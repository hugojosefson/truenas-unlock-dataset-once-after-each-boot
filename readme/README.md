# truenas-unlock-dataset-once-after-each-boot

Unlocks a dataset in your TrueNAS SCALE server, via ssh, whenever the server
boots.

[![CI](https://github.com/hugojosefson/truenas-unlock-dataset-once-after-each-boot/actions/workflows/deno.yaml/badge.svg)](https://github.com/hugojosefson/truenas-unlock-dataset-once-after-each-boot/actions/workflows/deno.yaml)

You run this script from a computer that you **actively keep physically
secure**, for example your laptop.

## Features

- Unlocks a dataset in your TrueNAS SCALE server, via ssh, whenever the server
  boots.
- Does not store the passphrase on disk.
  - Prompts you for the passphrase at the start of the script.
  - You may pipe the passphrase from a command, instead.
- Unlocks the dataset only once after each server boot.
  - If you manually lock the dataset, you probably did it on purpose, so it
    won't auto-unlock immediately.
  - If you reboot the server, the dataset it will unlock it again.
- Runs any executable `.unlockrc` file in the unlocked dataset's root directory,
  if present. It should be idempotent, because it will also run if this script
  starts and sees the dataset already unlocked.
- Afterwards, waits for the next reboot, and runs again.

## Requirements

### On your secure computer (laptop)

- `/bin/sh`
- `unzip`
- `curl`

### On your TrueNAS SCALE server

- Version 24.04 or later,
- SSH service enabled,
- SSH configured with public key-based passwordless login for an admin account,
- The admin account has access to the `cli` command.

## Installation

### On your secure computer (laptop)

```sh
"@@include(./install.sh)";
```

## Example usage

Examples below assume:

- Server IP is `10.20.30.40`,
- Account that can run `cli` in the server, is named `admin`.

### Manual passphrase entry

To type the passphrase manually at the start of the script:

```sh
"@@include(./example-usage-manual.sh)";
```

### Passphrase piped from command

If you have a command that outputs the passphrase, for example `pass`:

```sh
"@@include(./example-usage-pipe.sh)";
```
