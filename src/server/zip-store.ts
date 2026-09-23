import { crc32 } from "node:zlib";

export type ZipEntry = { name: string; data: Buffer };

function dosStamp(d: Date) {
  const time =
    (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export function uniqueEntryNames(names: string[]) {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const clean = name.replace(/\\/g, "/").split("/").pop() || "image";
    const count = seen.get(clean) ?? 0;
    seen.set(clean, count + 1);
    if (count === 0) return clean;
    const dot = clean.lastIndexOf(".");
    if (dot <= 0) return `${clean} (${count + 1})`;
    return `${clean.slice(0, dot)} (${count + 1})${clean.slice(dot)}`;
  });
}

/** Stored (uncompressed) zip. Enough for a local multi-file download. */
export function zipStore(files: ZipEntry[]): Buffer {
  const names = uniqueEntryNames(files.map((f) => f.name));
  const now = dosStamp(new Date());
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  files.forEach((file, index) => {
    const name = Buffer.from(names[index], "utf8");
    const crc = crc32(file.data) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(now.time, 10);
    local.writeUInt16LE(now.date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    const record = Buffer.concat([local, name, file.data]);
    locals.push(record);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(now.time, 12);
    central.writeUInt16LE(now.date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, name]));
    offset += record.length;
  });

  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDir, end]);
}

export function unzipStore(zip: Buffer): ZipEntry[] {
  const files: ZipEntry[] = [];
  let offset = 0;
  while (offset + 4 <= zip.length) {
    const sig = zip.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const method = zip.readUInt16LE(offset + 8);
    const comp = zip.readUInt32LE(offset + 18);
    const nameLen = zip.readUInt16LE(offset + 26);
    const extraLen = zip.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLen + extraLen;
    if (method !== 0) throw new Error("Only stored zip entries are supported");
    files.push({
      name: zip.subarray(nameStart, nameStart + nameLen).toString("utf8"),
      data: Buffer.from(zip.subarray(dataStart, dataStart + comp)),
    });
    offset = dataStart + comp;
  }
  return files;
}
