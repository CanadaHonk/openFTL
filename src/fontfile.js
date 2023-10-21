const MAGIC = [ 0x46, 0x4f, 0x4e, 0x54 ]; // "FONT"

export default class FontFile {
  buffer;
  offset = 0;
  chars = [];
  imageData;

  static async fromBuffer(buffer) {
    const fontFile = new FontFile();
    fontFile.buffer = new Uint8Array(buffer);
    await fontFile.read();

    return fontFile;
  }

  static fromFont(chars, imageData) {
    const fontFile = new FontFile();
    fontFile.buffer = null;

    fontFile.chars = chars;
    fontFile.imageData = imageData;

    return fontFile;
  }

  readByte() {
    this.offset++;
    return this.buffer[this.offset - 1];
  }

  readInt(bytes) {
    this.offset += bytes;

    if (bytes === 1) return this.buffer[this.offset - 1];
    // if (bytes === 2) return new Uint16Array(this.buffer, this.offset - bytes, 1)[0];
    if (bytes === 2) return new Uint16Array((new Uint8Array([ this.buffer[this.offset - 2 + 1], this.buffer[this.offset - 2] ])).buffer, 0, 1)[0];
    // if (bytes === 4) return new Uint32Array(this.buffer, this.offset - bytes, 1)[0];
    if (bytes === 4) return new Uint32Array((new Uint8Array([ this.buffer[this.offset - 4 + 3], this.buffer[this.offset - 4 + 2], this.buffer[this.offset - 4 + 1], this.buffer[this.offset - 4] ])).buffer, 0, 1)[0];

    // return new Uint32Array((new Uint8Array([ this.buffer[this.offset - 4 + 3], this.buffer[this.offset - 4 + 2], this.buffer[this.offset - 4 + 1], this.buffer[this.offset - 4] ])).buffer, 0, 1)[0];
  }

  async read() {
    this.offset = 0;

    for (let i = 0; i < MAGIC.length; i++) {
      if (this.readByte() !== MAGIC[i]) throw 'Invalid file magic';
    }

    this.offset += 8; // unknown 8 bytes

    const characterCount = this.readInt(2);
    const characterLength = this.readInt(2); // unsure
    console.log(characterCount, characterLength);

    const sectionSize = this.readInt(4); // 16 byte offset

    this.offset += 1; // unknown byte

    const _texHeight = this.readInt(2); // unsure

    this.offset += 1; // unknown byte

    // this.offset = 42;
    const chars = new Array(characterCount);
    for (let i = 0; i < characterCount; i++) {
      // this.offset = 43 + 16 * i;

      const char = String.fromCharCode(this.readInt(4));

      const left = this.readInt(2);
      const top = this.readInt(2);

      const width = this.readInt(1);
      const height = this.readInt(1);

      const baseline = this.readInt(1);
      const spacingBefore = this.readInt(2);
      const spacingAfter = this.readInt(2);

      this.offset += 1; // unknown byte

      chars[i] = { char, left, top, width, height, baseline, spacingBefore, spacingAfter };
      // console.log(this.offset, i, char);
    }

    this.chars = chars.reduce((acc, x) => { acc[x.char] = x; return acc; }, {});

    this.offset = sectionSize;

    this.offset += 8; // unknown 8 bytes

    const texWidth = this.readInt(2);
    const texHeight = this.readInt(2);

    this.offset += 8; // unknown 8 bytes

    const dataSize = this.readInt(4);

    this.offset += 8; // unknown 8 bytes

    // const texData = this.buffer.slice(this.offset, this.buffer.length - 1);

    // convert greyscale bitmap into rgba
    const rawImageData = new Uint8ClampedArray(4 * texWidth * texHeight);
    let ind = 0;
    while (this.offset !== this.buffer.length) {
      const val = this.readByte();
      rawImageData[ind] = val;
      rawImageData[ind + 1] = val;
      rawImageData[ind + 2] = val;
      rawImageData[ind + 3] = val ? 255 : 0; // alpha

      ind += 4;
    }

    this.imageData = new ImageData(rawImageData, texWidth, texHeight);

    const promises = [];
    for (const x in this.chars) {
      const char = this.chars[x];

      promises.push(createImageBitmap(this.imageData, char.left, char.top, char.width || 1, char.height || 1).then(y => char.bitmap = y));
    }

    await Promise.all(promises);
  }
}