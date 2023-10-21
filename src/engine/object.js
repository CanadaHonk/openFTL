export default class Object {
  x = 0; y = 0;
  width = 0; height = 0;
  interactable = false;

  constructor() {
    window.objects.push(this);
  }

  draw() {
    if (pressing.q) {
      ctx.strokeStyle = this.hovering ? 'yellow' : 'red';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  getBoundingBox() {
    if (this.interactable !== true) return null;
    if (window.optionsWindow && this.inOptionsWindow !== true) return null;

    return [
      this.x,
      this.y,
      this.x + this.width,
      this.y + this.height
    ];
  }

  destroy() {
    window.objects.splice(window.objects.indexOf(this), 1);
    delete this;
  }
}