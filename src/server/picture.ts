import { deflateSync } from "node:zlib";

/**
 * Dependency-free PNG encoder for the demo artwork served by
 * src/app/picture/[size]/route.ts. Deterministic: same size, same bytes.
 */

/** Sizes served by /picture/[size] and rendered on the dashboard. */
export const PICTURE_SIZES = [64, 128, 256] as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (CRC_TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(4 + typeAndData.length + 4);
  out.writeUInt32BE(data.length, 0);
  typeAndData.copy(out, 4);
  out.writeUInt32BE(crc32(typeAndData), 4 + typeAndData.length);
  return out;
}

/** Sky-to-violet gradient with concentric rings; resolution-independent. */
function pixel(nx: number, ny: number): [number, number, number] {
  const t = (nx + ny) / 2;
  const base: [number, number, number] = [
    Math.round(56 + (139 - 56) * t),
    Math.round(189 + (92 - 189) * t),
    Math.round(248 + (246 - 248) * t),
  ];
  const d = Math.hypot(nx - 0.5, ny - 0.5);
  const ring = 0.85 + 0.15 * Math.sin(d * 40);
  return [
    Math.min(255, Math.round(base[0] * ring)),
    Math.min(255, Math.round(base[1] * ring)),
    Math.min(255, Math.round(base[2] * ring)),
  ];
}

export function generatePicture(size: number): Buffer {
  // one filter byte (0 = None) per scanline, then RGBA
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4) + 1;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      const i = rowStart + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // compression, filter, interlace = 0

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
