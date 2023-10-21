import Obj from './object.js';

export default class Image extends Obj {
  constructor(assets, x, y) {
    super();

    Object.assign(this, { assets, x, y });

    this.width = this.assets[0].img.width;
    this.height = this.assets[0].img.height;

    this.interactable = this.assets.length > 1;
  }

  draw() {
    let asset = this.assets[0];
    if (this.hovering && this.assets.length > 1) asset = this.assets[1];
    if (this.clicking && this.assets.length > 2) asset = this.assets[2];

    ctx.drawImage(asset.img, this.x, this.y);

    super.draw();
  }
}