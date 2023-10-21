import FontFile from './fontfile.js';

const te = new TextDecoder();

const MAGIC = [ 0x50, 0x4B, 0x47, 0x0A ]; // "PKG\n"
const HEADER_SIZE = 16;
const ENTRY_SIZE = 20;

export default class DatFile {
  buffer;
  offset = 0;
  entries = [];

  static fromBuffer(buffer) {
    const datFile = new DatFile();
    datFile.buffer = new Uint8Array(buffer);
    datFile.read();

    return datFile;
  }

  static fromEntries(entries) {
    const datFile = new DatFile();
    datFile.buffer = null;
    datFile.entries = entries;

    return datFile;
  }

  readByte() {
    this.offset++;
    return this.buffer[this.offset - 1];
  }

  readInt() {
    this.offset += 4;
    return new Uint32Array((new Uint8Array([ this.buffer[this.offset - 4 + 3], this.buffer[this.offset - 4 + 2], this.buffer[this.offset - 4 + 1], this.buffer[this.offset - 4] ])).buffer, 0, 1)[0];
  }

  readShort() {
    this.offset += 2;
    return new Uint16Array((new Uint8Array([ this.buffer[this.offset - 2 + 1], this.buffer[this.offset - 2] ])).buffer, 0, 1)[0];
  }

  readString(buffer, offset) {
    const bytes = [];

    while (true) {
      const byte = buffer[offset++];
      if (byte === 0x00 || byte === undefined) break;

      bytes.push(byte);
    }

    return te.decode(new Uint8Array(bytes));
  }

  readEntry(entry) {
    return entry.data ??= this.buffer.slice(entry.dataOffset, entry.dataOffset + entry.dataSize);
  }

  getEntryType(entry) {
    return entry.type ??= entry.path.split('.').pop();
  }

  getEntryString(entry) {
    if (entry.string) return entry.string;

    return te.decode(this.readEntry(entry));

    const data = this.readEntry(entry);
    const length = data.byteLength;
    let binary = '';

    for (let i = 0; i < length; i++) {
      binary += String.fromCharCode(data[i]);
    }

    return binary;
  }

  getEntryBase64(entry) {
    if (entry.base64) return entry.base64;

    const data = this.readEntry(entry);
    const length = data.byteLength;
    let binary = '';

    for (let i = 0; i < length; i++) {
      binary += String.fromCharCode(data[i]);
    }

    return entry.base64 = btoa(binary);
  }

  // main only
  getEntryURL(entry) {
    if (entry.url) return entry.url;

    const type = this.getEntryType(entry);

    switch (type) {
      case 'png': {
        // return entry.url = 'data:image/png;base64,' + this.getEntryBase64(entry);
        return entry.url = URL.createObjectURL(new Blob([ this.readEntry(entry) ], { type: 'image/png' }));
      };
      case 'xml': return;
      case 'txt': return;
    }
  }

  // main only - CAUSES FREEZES
  getEntryImg(entry) {
    if (entry.img) return entry.img;

    const el = document.createElement('img');
    el.src = this.getEntryURL(entry);
    return entry.img = el;
  }

  getEntryXML(entry, dp = new DOMParser()) {
    if (entry.xml) return entry.xml;

    const string = this.getEntryString(entry);
    return entry.xml = dp.parseFromString(string, 'application/xml');
  }

  getEntryFont(entry) {
    if (entry.font) return entry.font;

    const fontFile = FontFile.fromBuffer(this.readEntry(entry));
    return entry.font = {
      chars: fontFile.chars,
      imageData: fontFile.imageData
    };
  }

  read() {
    this.offset = 0;

    for (let i = 0; i < MAGIC.length; i++) {
      if (this.readByte() !== MAGIC[i]) throw 'Invalid file magic';
    }

    const headerSize = this.readShort();
    if (headerSize !== HEADER_SIZE) throw `Unexpected header size (expected ${HEADER_SIZE}, got ${headerSize})`;

    const entrySize = this.readShort();
    if (entrySize !== ENTRY_SIZE) throw `Unexpected entry size (expected ${ENTRY_SIZE}, got ${entrySize})`;

    const entryCount = this.readInt();
    const pathsRegionSize = this.readInt();

    const entries = new Array(entryCount);
    for (let i = 0; i < entryCount; i++) {
      const innerPathHash = this.readInt();

      const pathOffsetAndFlags = this.readInt();
      const innerPathOffset = pathOffsetAndFlags & 0x00FFFFFF;
      const dataDeflated = (pathOffsetAndFlags & (1 << 24)) !== 0;

      const dataOffset = this.readInt();
      const dataSize = this.readInt();
      const unpackedSize = this.readInt();

      if (dataOffset === 0) continue;

      entries[i] = { innerPathHash, innerPathOffset, dataDeflated, dataOffset, dataSize, unpackedSize };

      postMessage({ type: 'progress', phase: 1, current: i, outOf: entryCount });
    }

    const pathsRegion = this.buffer.slice(this.offset, this.offset + pathsRegionSize);
    this.offset += pathsRegionSize;

    const pathIndexMap = {};
    for (let i = 0; i < entryCount; i++) {
      const entry = entries[i];
      if (!entry) continue;

      const path = this.readString(pathsRegion, entry.innerPathOffset);
      entry.path = path;
      pathIndexMap[path] = i;

      postMessage({ type: 'progress', phase: 2, current: i, outOf: entryCount });
    }

    this.entries = entries.filter(x => x);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // pre-read and pre-compute URL
      this.readEntry(entry);
      // this.getEntryURL(entry);

      const type = this.getEntryType(entry);

      // if (type === 'font') this.getEntryFont(entry);

      postMessage({ type: 'progress', phase: 3, ext: type, current: i, outOf: entryCount });
    }
  }
}