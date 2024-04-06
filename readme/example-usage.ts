#!/usr/bin/env -S deno run
import { placeholder } from "../mod.ts";

const result = placeholder();
console.dir({ result });
