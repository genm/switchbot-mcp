import { describe, expect, it } from "vitest";

import { TtlCache } from "../../src/cache/ttl-cache.js";

describe("TtlCache", () => {
  it("stores and expires values by ttl", () => {
    let now = 1000;
    const cache = new TtlCache<string>(() => now);

    cache.set("k", "v", 50);
    expect(cache.get("k")).toBe("v");

    now = 1051;
    expect(cache.get("k")).toBeUndefined();
  });

  it("can delete and clear entries", () => {
    const cache = new TtlCache<string>();
    cache.set("a", "1", 1000);
    cache.set("b", "2", 1000);

    cache.delete("a");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");

    cache.clear();
    expect(cache.get("b")).toBeUndefined();
  });
});
