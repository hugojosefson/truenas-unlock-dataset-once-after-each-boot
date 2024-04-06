#!/usr/bin/env bash
# create and enter a directory for the script
mkdir -p truenas-unlock-dataset-once-after-each-boot
cd       truenas-unlock-dataset-once-after-each-boot

# download+extract the script, into current directory
curl -fsSL https://github.com/hugojosefson/truenas-unlock-dataset-once-after-each-boot/tarball/main \
  | tar -xzv --strip-components=1
