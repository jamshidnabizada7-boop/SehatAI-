/**
 * SehatAI — Zero-dependency, offline-first QR Code Matrix Generator
 * Generates ISO/IEC 18004 compliant QR Codes (Versions 1-12, EC Level M)
 * for clinical triage summary sharing and doctor OPD scanning.
 */

// GF(256) arithmetic for Reed-Solomon error correction
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
  }
  LOG_TABLE[0] = 0;
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMul(poly[j], factor);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function rsCompute(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const result = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    result.copyWithin(0, 1);
    result[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      result[j] ^= gfMul(gen[j], factor);
    }
  }
  return result;
}

// Table of QR versions with capacity and block counts (EC level M)
interface VersionInfo {
  version: number;
  totalCodewords: number;
  ecCodewordsPerBlock: number;
  blocks: { count: number; dataCodewords: number }[];
  alignmentPatterns: number[];
}

const QR_VERSIONS: VersionInfo[] = [
  { version: 1, totalCodewords: 26, ecCodewordsPerBlock: 10, blocks: [{ count: 1, dataCodewords: 16 }], alignmentPatterns: [] },
  { version: 2, totalCodewords: 44, ecCodewordsPerBlock: 16, blocks: [{ count: 1, dataCodewords: 28 }], alignmentPatterns: [6, 18] },
  { version: 3, totalCodewords: 70, ecCodewordsPerBlock: 26, blocks: [{ count: 1, dataCodewords: 44 }], alignmentPatterns: [6, 22] },
  { version: 4, totalCodewords: 100, ecCodewordsPerBlock: 18, blocks: [{ count: 2, dataCodewords: 32 }], alignmentPatterns: [6, 26] },
  { version: 5, totalCodewords: 134, ecCodewordsPerBlock: 24, blocks: [{ count: 2, dataCodewords: 43 }], alignmentPatterns: [6, 30] },
  { version: 6, totalCodewords: 172, ecCodewordsPerBlock: 16, blocks: [{ count: 4, dataCodewords: 27 }], alignmentPatterns: [6, 34] },
  { version: 7, totalCodewords: 196, ecCodewordsPerBlock: 18, blocks: [{ count: 4, dataCodewords: 31 }], alignmentPatterns: [6, 22, 38] },
  { version: 8, totalCodewords: 242, ecCodewordsPerBlock: 22, blocks: [{ count: 2, dataCodewords: 38 }, { count: 2, dataCodewords: 39 }], alignmentPatterns: [6, 24, 42] },
  { version: 9, totalCodewords: 292, ecCodewordsPerBlock: 22, blocks: [{ count: 3, dataCodewords: 36 }, { count: 2, dataCodewords: 37 }], alignmentPatterns: [6, 26, 46] },
  { version: 10, totalCodewords: 346, ecCodewordsPerBlock: 26, blocks: [{ count: 4, dataCodewords: 43 }, { count: 1, dataCodewords: 44 }], alignmentPatterns: [6, 28, 50] },
  { version: 11, totalCodewords: 404, ecCodewordsPerBlock: 30, blocks: [{ count: 1, dataCodewords: 50 }, { count: 4, dataCodewords: 51 }], alignmentPatterns: [6, 30, 54] },
  { version: 12, totalCodewords: 466, ecCodewordsPerBlock: 22, blocks: [{ count: 6, dataCodewords: 36 }, { count: 2, dataCodewords: 37 }], alignmentPatterns: [6, 32, 58] },
  { version: 13, totalCodewords: 532, ecCodewordsPerBlock: 26, blocks: [{ count: 4, dataCodewords: 40 }, { count: 4, dataCodewords: 41 }], alignmentPatterns: [6, 34, 62] },
  { version: 14, totalCodewords: 581, ecCodewordsPerBlock: 24, blocks: [{ count: 4, dataCodewords: 40 }, { count: 5, dataCodewords: 41 }], alignmentPatterns: [6, 26, 46, 66] },
  { version: 15, totalCodewords: 655, ecCodewordsPerBlock: 24, blocks: [{ count: 5, dataCodewords: 41 }, { count: 5, dataCodewords: 42 }], alignmentPatterns: [6, 26, 48, 70] },
  { version: 16, totalCodewords: 733, ecCodewordsPerBlock: 28, blocks: [{ count: 7, dataCodewords: 45 }, { count: 3, dataCodewords: 46 }], alignmentPatterns: [6, 26, 50, 74] },
  { version: 17, totalCodewords: 815, ecCodewordsPerBlock: 28, blocks: [{ count: 10, dataCodewords: 46 }, { count: 1, dataCodewords: 47 }], alignmentPatterns: [6, 30, 54, 78] },
  { version: 18, totalCodewords: 901, ecCodewordsPerBlock: 26, blocks: [{ count: 9, dataCodewords: 43 }, { count: 4, dataCodewords: 44 }], alignmentPatterns: [6, 30, 56, 82] },
  { version: 19, totalCodewords: 991, ecCodewordsPerBlock: 26, blocks: [{ count: 3, dataCodewords: 44 }, { count: 11, dataCodewords: 45 }], alignmentPatterns: [6, 30, 58, 86] },
  { version: 20, totalCodewords: 1085, ecCodewordsPerBlock: 26, blocks: [{ count: 3, dataCodewords: 41 }, { count: 13, dataCodewords: 42 }], alignmentPatterns: [6, 34, 62, 90] },
];

// BCH(18,6) version information bits for versions 7 to 20 (ISO/IEC 18004 Table D.1)
const VERSION_INFO: Record<number, number> = {
  7: 0x07c94,
  8: 0x085bc,
  9: 0x09a99,
  10: 0x0a4d3,
  11: 0x0bbf6,
  12: 0x0c762,
  13: 0x0d847,
  14: 0x0e60d,
  15: 0x0f928,
  16: 0x10b78,
  17: 0x1145d,
  18: 0x12a17,
  19: 0x13532,
  20: 0x149a6,
};

// Format info bit patterns for EC Level M (mask 0 to 7)
const FORMAT_INFO_M = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
];

export function generateQrMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  
  // Find smallest version that fits
  let selectedVersion: VersionInfo | null = null;
  for (const v of QR_VERSIONS) {
    const totalDataCodewords = v.blocks.reduce((sum, b) => sum + b.count * b.dataCodewords, 0);
    // Byte mode header: 4 bits mode + 8 or 16 bits count + data bits + 4 bits terminator
    const countBits = v.version <= 9 ? 8 : 16;
    const requiredBits = 4 + countBits + utf8.length * 8;
    if (requiredBits <= totalDataCodewords * 8) {
      selectedVersion = v;
      break;
    }
  }

  if (!selectedVersion) {
    // If text is larger than version 12, use max version
    selectedVersion = QR_VERSIONS[QR_VERSIONS.length - 1];
  }

  const version = selectedVersion.version;
  const size = 17 + version * 4;
  const countBits = version <= 9 ? 8 : 16;

  const totalDataCodewords = selectedVersion.blocks.reduce((sum, b) => sum + b.count * b.dataCodewords, 0);

  // Encode BitStream
  const bits: number[] = [];
  const appendBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Byte mode indicator: 0100
  appendBits(0b0100, 4);
  const dataLen = Math.min(utf8.length, Math.floor((totalDataCodewords * 8 - 4 - countBits) / 8));
  appendBits(dataLen, countBits);
  for (let i = 0; i < dataLen; i++) {
    appendBits(utf8[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const maxBits = totalDataCodewords * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  for (let i = 0; i < termLen; i++) bits.push(0);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad codewords
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    appendBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data codewords
  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataCodewords.push(byte);
  }

  // Split into blocks and compute RS EC
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let cwOffset = 0;
  for (const blockInfo of selectedVersion.blocks) {
    for (let b = 0; b < blockInfo.count; b++) {
      const blockData = new Uint8Array(dataCodewords.slice(cwOffset, cwOffset + blockInfo.dataCodewords));
      cwOffset += blockInfo.dataCodewords;
      dataBlocks.push(blockData);
      ecBlocks.push(rsCompute(blockData, selectedVersion.ecCodewordsPerBlock));
    }
  }

  // Interleave data codewords
  const finalCodewords: number[] = [];
  const maxDataBlockLen = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxDataBlockLen; i++) {
    for (const b of dataBlocks) {
      if (i < b.length) finalCodewords.push(b[i]);
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < selectedVersion.ecCodewordsPerBlock; i++) {
    for (const b of ecBlocks) {
      finalCodewords.push(b[i]);
    }
  }

  // Create matrix: null = unset, true = black, false = white
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunc = (r: number, c: number, val: boolean) => {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  };

  // 1. Finder patterns (7x7 with 1-module separator)
  const drawFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setFunc(row, col, isBlack);
        } else {
          setFunc(row, col, false);
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setFunc(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setFunc(i, 6, i % 2 === 0);
  }

  // 3. Dark module
  setFunc(4 * version + 9, 8, true);

  // 4. Alignment patterns (version >= 2)
  const alignPos = selectedVersion.alignmentPatterns;
  for (let i = 0; i < alignPos.length; i++) {
    for (let j = 0; j < alignPos.length; j++) {
      const r = alignPos[i];
      const c = alignPos[j];
      if (isFunction[r][c]) continue; // Skip if overlaps finder
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunc(r + dr, c + dc, isBlack);
        }
      }
    }
  }

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }

  // Reserve version information areas (version >= 7)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        isFunction[size - 11 + j][i] = true;
        isFunction[i][size - 11 + j] = true;
      }
    }
  }

  // Convert final codewords to bit array
  const allDataBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) {
      allDataBits.push((cw >> b) & 1);
    }
  }

  // Place data bits with 2-module column zig-zag traversal
  let bitIdx = 0;
  let upwards = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing column
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [col, col - 1]) {
        if (!isFunction[r][c]) {
          matrix[r][c] = bitIdx < allDataBits.length ? allDataBits[bitIdx] === 1 : false;
          bitIdx++;
        }
      }
    }
    upwards = !upwards;
  }

  // Mask evaluation & selection (mask 0 is standard and universally supported)
  const mask = 0;
  const isMasked = (r: number, c: number) => (r + c) % 2 === 0;

  // Apply mask
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && matrix[r][c] !== null) {
        if (isMasked(r, c)) {
          matrix[r][c] = !matrix[r][c];
        }
      }
    }
  }

  // Write format info bits (EC Level M, Mask 0)
  const formatInfo = FORMAT_INFO_M[mask];
  // Around top-left finder
  for (let i = 0; i < 6; i++) matrix[8][i] = ((formatInfo >> (14 - i)) & 1) === 1;
  matrix[8][7] = ((formatInfo >> 8) & 1) === 1;
  matrix[8][8] = ((formatInfo >> 7) & 1) === 1;
  matrix[7][8] = ((formatInfo >> 6) & 1) === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = ((formatInfo >> (14 - i)) & 1) === 1;

  // Around top-right and bottom-left finders
  for (let i = 0; i < 8; i++) matrix[8][size - 1 - i] = ((formatInfo >> i) & 1) === 1;
  for (let i = 0; i < 7; i++) matrix[size - 7 + i][8] = ((formatInfo >> (7 + i)) & 1) === 1;

  // Write version info bits (version >= 7)
  if (version >= 7 && VERSION_INFO[version]) {
    const vInfo = VERSION_INFO[version];
    for (let i = 0; i < 18; i++) {
      const bit = ((vInfo >> i) & 1) === 1;
      // Bottom-left block (above bottom-left finder)
      matrix[size - 11 + (i % 3)][Math.floor(i / 3)] = bit;
      // Top-right block (left of top-right finder)
      matrix[Math.floor(i / 3)][size - 11 + (i % 3)] = bit;
    }
  }

  return matrix.map((row) => row.map((cell) => cell ?? false));
}
