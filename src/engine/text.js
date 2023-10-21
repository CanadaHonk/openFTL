import Obj from './object.js';

const prerender = true;
const OC_WIDTH = 2000, OC_HEIGHT = 200;

export default class Text extends Obj {
  text = '';
  scale = 1;

  constructor(font, x, y) {
    super();

    Object.assign(this, { font, x, y });
  }

  static measure(_font, text) {
    const font = _font.font;

    let width = 0;
    let height = 0;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const char = font.chars[c];

      if (i !== 0) width += char.spacingBefore;

      width += char.width;

      if (i !== text.length - 1) width += char.spacingAfter + (this.kerning ?? 0);

      height = Math.max(height, char.height);
    }

    return [ width, height ];
  }

  setText(text) {
    this.text = text;

    let width = 0;
    let height = 0;

    const font = this.font.font;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const char = font.chars[c];

      if (i !== 0) width += char.spacingBefore;

      width += char.width;

      if (i !== text.length - 1) width += char.spacingAfter + (this.kerning ?? 0);

      height = Math.max(height, char.height);
    }

    width *= this.scale;
    height *= this.scale;

    this.width = width;
    this.height = height;

    if (prerender) {
      // pre-render to our own offscreen canvas
      if (!this.oc) {
        this.oc = new OffscreenCanvas(OC_WIDTH, OC_HEIGHT);
        this.octx = this.oc.getContext('2d');
      }

      const ctx = this.octx;

      if (this.scale) {
        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(this.scale, this.scale);
      }

      const render = () => {
        let x = 0, y = 0;
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          const char = font.chars[c];

          if (i !== 0) x += char.spacingBefore;

          // this.octx.putImageData(font.imageData, x - char.left, y - char.top - char.baseline, char.left, char.top, char.width, char.height);
          ctx.drawImage(char.bitmap, x, y - char.baseline + this.height / this.scale);

          x += char.width;

          x += char.spacingAfter + (this.kerning ?? 0);
        }
      };

      ctx.clearRect(0, 0, OC_WIDTH, OC_HEIGHT);
      ctx.globalCompositeOperation = 'source-over';
      render();

      if (this.color) {
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, OC_WIDTH, OC_HEIGHT);
      }

      if (this.ocBitmap) this.ocBitmap.close();
      this.ocBitmap = null;
      createImageBitmap(this.oc).then(x => this.ocBitmap = x);

      if (this.hoverColor) {
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = this.hoverColor;
        ctx.fillRect(0, 0, OC_WIDTH, OC_HEIGHT);

        if (this.ocHoverBitmap) this.ocHoverBitmap.close();
        this.ocHoverBitmap = null;
        createImageBitmap(this.oc).then(x => this.ocHoverBitmap = x);
      }
    }

    return this;
  }

  setColor([ r, g, b ]) {
    this.color = `rgb(${r}, ${g}, ${b})`;

    // prerender
    this.setText(this.text);

    return this;
  }

  setHoverColor([ r, g, b ]) {
    this.interactable = true;
    this.hoverColor = `rgb(${r}, ${g}, ${b})`;

    // prerender
    this.setText(this.text);

    return this;
  }

  setScale(scale) {
    this.scale = scale;

    // prerender
    this.setText(this.text);

    return this;
  }

  setKerning(kerning) {
    this.kerning = kerning;

    // prerender
    this.setText(this.text);

    return this;
  }

  setOnClick(handler) {
    this.onClick = handler.bind(this);

    this.setHoverColor([255, 230, 94]);

    return this;
  }

  draw() {
    if (prerender && this.oc) {
      ctx.drawImage(this.hovering ? this.ocHoverBitmap : (this.ocBitmap ?? this.oc), this.x, this.y);

      super.draw();
      return;
    }

    let x = this.x;
    const font = this.font.font;
    const text = this.text;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const char = font.chars[c];

      if (i !== 0) x += char.spacingBefore;

      ctx.drawImage(char.bitmap, x, this.y - char.baseline + this.height);

      x += char.width;

      x += char.spacingAfter;
    }

    // no non-prerender coloring

    super.draw();
  }

  destroy() {
    delete this.oc;
    this.ocBitmap?.close?.();
    this.ocHoverBitmap?.close?.();

    super.destroy();
  }
}