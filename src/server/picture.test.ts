import { describe, expect, test } from "bun:test";
import { generatePicture } from "./picture";

describe("generatePicture", () => {
  test("produces a valid PNG with the requested dimensions", () => {
    const png = generatePicture(64);

    // PNG signature
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    // IHDR width/height (big-endian at offsets 16/20)
    expect(png.readUInt32BE(16)).toBe(64);
    expect(png.readUInt32BE(20)).toBe(64);
    // ends with IEND
    expect(png.subarray(png.length - 8, png.length - 4).toString("ascii")).toBe("IEND");
  });

  test("is deterministic", () => {
    expect(generatePicture(32).equals(generatePicture(32))).toBe(true);
  });

  test("different sizes produce different images", () => {
    expect(generatePicture(32).equals(generatePicture(64))).toBe(false);
  });
});
