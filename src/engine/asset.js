export default class Asset {
  constructor(datFile, asset) {
    Object.assign(this, { datFile, asset });
  }

  get img() {
    return this.datFile.getEntryImg(this.asset);
  }

  get font() {
    return this.datFile.getEntryFont(this.asset);
  }
}