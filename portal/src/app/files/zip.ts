/**
 * Minimal ZIP reader (stored + deflate) for Office Open XML / ODF packages.
 */
function u16(v: DataView, o: number): number {
  return v.getUint16(o, true);
}
function u32(v: DataView, o: number): number {
  return v.getUint32(o, true);
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Deflate is not available in this browser");
  }
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

export async function unzipEntries(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const u8 = new Uint8Array(buf);
  const view = new DataView(buf);
  let eocd = -1;
  const min = Math.max(0, u8.length - 22 - 65535);
  for (let i = u8.length - 22; i >= min; i--) {
    if (u32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a ZIP file");
  const count = u16(view, eocd + 10);
  let cdOff = u32(view, eocd + 16);
  const out = new Map<string, Uint8Array>();
  const dec = new TextDecoder("utf-8");
  for (let n = 0; n < count; n++) {
    if (u32(view, cdOff) !== 0x02014b50) throw new Error("Bad ZIP directory");
    const method = u16(view, cdOff + 10);
    const compSize = u32(view, cdOff + 20);
    const nameLen = u16(view, cdOff + 28);
    const extraLen = u16(view, cdOff + 30);
    const commentLen = u16(view, cdOff + 32);
    const localOff = u32(view, cdOff + 42);
    const name = dec.decode(u8.subarray(cdOff + 46, cdOff + 46 + nameLen)).replace(/\\/g, "/");
    cdOff += 46 + nameLen + extraLen + commentLen;
    if (!name || name.endsWith("/")) continue;
    const localNameLen = u16(view, localOff + 26);
    const localExtra = u16(view, localOff + 28);
    const dataStart = localOff + 30 + localNameLen + localExtra;
    const data = u8.subarray(dataStart, dataStart + compSize);
    if (method === 0) out.set(name, data.slice());
    else if (method === 8) out.set(name, await inflateRaw(data));
  }
  return out;
}

export function zipText(files: Map<string, Uint8Array>, path: string): string | null {
  const raw = files.get(path);
  if (!raw) return null;
  return new TextDecoder("utf-8").decode(raw);
}
