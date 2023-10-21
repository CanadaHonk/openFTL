export default class Pointer {
  constructor(assets) {
    Object.assign(this, { assets });

    this.x = -99;
    this.y = -99;

    this.width = this.assets.valid.img.width;
    this.height = this.assets.valid.img.height;
  }

  draw() {
    ctx.drawImage(this.assets[this.asset].img, this.x, this.y);

    if (pressing.q) {
      ctx.strokeStyle = 'blue';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}