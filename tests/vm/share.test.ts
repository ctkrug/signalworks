import { describe, expect, it } from "vitest";
import { encodeShareQuery, parseShareQuery } from "../../src/vm/share";

describe("encodeShareQuery", () => {
  it("encodes a level id and cycle count as a query string", () => {
    expect(encodeShareQuery("signal-passthrough", 3)).toBe("?level=signal-passthrough&score=3");
  });
});

describe("parseShareQuery", () => {
  it("round-trips a value produced by encodeShareQuery", () => {
    const query = encodeShareQuery("double-take", 12);
    expect(parseShareQuery(query)).toEqual({ levelId: "double-take", cycles: 12 });
  });

  it("accepts a leading '?' or a bare query string", () => {
    expect(parseShareQuery("level=double-take&score=5")).toEqual({
      levelId: "double-take",
      cycles: 5,
    });
  });

  it("returns null for an empty query", () => {
    expect(parseShareQuery("")).toBeNull();
  });

  it("returns null when the level id is unknown", () => {
    expect(parseShareQuery("?level=does-not-exist&score=3")).toBeNull();
  });

  it("returns null for a non-numeric score", () => {
    expect(parseShareQuery("?level=signal-passthrough&score=not-a-number")).toBeNull();
  });

  it("returns null for a negative or zero score", () => {
    expect(parseShareQuery("?level=signal-passthrough&score=-1")).toBeNull();
    expect(parseShareQuery("?level=signal-passthrough&score=0")).toBeNull();
  });

  it("returns null when the level param is missing", () => {
    expect(parseShareQuery("?score=3")).toBeNull();
  });

  it("returns null when the score param is missing", () => {
    expect(parseShareQuery("?level=signal-passthrough")).toBeNull();
  });

  it("ignores a tampered score with trailing garbage", () => {
    expect(parseShareQuery("?level=signal-passthrough&score=3abc")).toBeNull();
  });

  it("returns null for a decimal score", () => {
    expect(parseShareQuery("?level=signal-passthrough&score=3.5")).toBeNull();
  });

  it("ignores unrelated params alongside a valid level and score", () => {
    expect(parseShareQuery("?utm_source=friend&level=double-take&score=2&ref=chat")).toEqual({
      levelId: "double-take",
      cycles: 2,
    });
  });
});
