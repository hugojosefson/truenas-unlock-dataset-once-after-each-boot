import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { placeholder } from "../mod.ts";

describe("placeholder", () => {
  it("should not throw", () => {
    placeholder();
  });
});
