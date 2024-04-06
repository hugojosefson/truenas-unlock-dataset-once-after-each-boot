#!/usr/bin/env bash
pass my-zfs-encryption | head -n1 | ./src/cli.ts tank admin@10.20.30.40
