import Image from '../engine/image.js';
import Text from '../engine/text.js';

const background = new Image([ window.assets['img/main_menus/main_base2.png'] ], 0, 0);

const scaleModes = [ 'borders', 'stretch', 'none' ];
const upscaleModes = [ 'blurry', 'pixelated' ];

class OptionsWindow extends Image {
  constructor() {
    const width = 826;
    const height = 450;

    super([ window.assets['img/optionsUI_new.png'] ], (WIDTH - width) / 2, (HEIGHT - height) / 2);
    this.inOptionsWindow = true;

    const close = new Image([
      window.assets['img/storeUI/store_close_on.png'],
      window.assets['img/storeUI/store_close_select2.png']
    ], 892, 430);

    close.onClick = () => this.close();

    const upscaleText = new Text(window.assets['fonts/JustinFont12Bold.font'], 640 - Text.measure(window.assets['fonts/JustinFont12Bold.font'], SCALE_MODE === 'none' ? '' : `Upscaling: ${UPSCALE_MODE}`)[0] - 20, 222).setText(SCALE_MODE === 'none' ? '' : `Upscaling: ${UPSCALE_MODE}`).setOnClick(function() {
      UPSCALE_MODE = upscaleModes[(upscaleModes.indexOf(UPSCALE_MODE) + 1) % upscaleModes.length];

      upscaleText.x = 640 - Text.measure(window.assets['fonts/JustinFont12Bold.font'], SCALE_MODE === 'none' ? '' : `Upscaling: ${UPSCALE_MODE}`)[0] - 20;
      this.setText(`Upscaling: ${UPSCALE_MODE}`);

      setCanvasStyle();
    });

    this.objs = [
      // titles
      new Text(window.assets['fonts/HL2.font'], 288, 146).setText('OPTIONS').setColor([ 9, 5, 10 ]).setScale(3).setKerning(0.5),
      new Text(window.assets['fonts/HL2.font'], 252, 182).setText('VIDEO').setColor([ 9, 5, 10 ]).setScale(2).setKerning(0.5),

      // video options
      new Text(window.assets['fonts/JustinFont12Bold.font'], 262, 222).setText(`Scaling: ${SCALE_MODE}`).setOnClick(function() {
        SCALE_MODE = scaleModes[(scaleModes.indexOf(SCALE_MODE) + 1) % scaleModes.length];
        this.setText(`Scaling: ${SCALE_MODE}`);

        upscaleText.x = 640 - Text.measure(window.assets['fonts/JustinFont12Bold.font'], SCALE_MODE === 'none' ? '' : `Upscaling: ${UPSCALE_MODE}`)[0] - 20;
        upscaleText.setText(SCALE_MODE === 'none' ? '' : `Upscaling: ${UPSCALE_MODE}`);

        setCanvasStyle();
      }),
      upscaleText,

      // close
      new Image([ window.assets['img/storeUI/store_close_base.png'] ], 892, 430),
      close
    ];

    this.objs.forEach(x => x.inOptionsWindow = true);
  }

  draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    super.draw();

    this.objs.forEach(x => x.draw());
  }

  close() {
    this.objs.forEach(x => x.destroy());
    this.destroy();
    optionsWindow = null;
  }
}

window.optionsWindow = null;
class MainButton extends Image {
  constructor(path, index) {
    const basePath = 'img/main_menus/' + path;

    const assets = disabled.includes(path) ? [ window.assets[basePath + '_off.png'] ] : [
      window.assets[basePath + '_on.png'], // normal
      window.assets[basePath + '_select2.png'] // hover
    ];

    const x = WIDTH - assets[0].img.width - 80;
    const y = 275 + index * (assets[0].img.height - 4);

    super(assets, x, y);
    this.button = path;
  }

  onClick() {
    if (this.button === 'options') {
      optionsWindow = new OptionsWindow();
    }
  }
}

// const disabled = [ 'continue' ];
const disabled = [ 'continue', 'start', 'tutorial', 'stats', 'credits', 'quit' ];
let buttons = [ 'continue', 'start', 'tutorial', 'stats', 'options', 'credits', 'quit' ];

for (let i = 0; i < buttons.length; i++) {
  buttons[i] = new MainButton(buttons[i], i);
}

const info = `openFTL ${VERSION}`;
const infoFont = window.assets['fonts/JustinFont10.font'];
const [ infoTextWidth, infoTextHeight ] = Text.measure(infoFont, info);
const infoText = new Text(infoFont, WIDTH - infoTextWidth - 20, HEIGHT - infoTextHeight - 10).setText(info);

const pointerPosText = new Text(infoFont, 20, 10);
window.hooks.push((pointer, fps) => {
  pointerPosText.setText(`FPS: ${fps.toFixed(0)} | X: ${pointer.x.toFixed(0)}, Y: ${pointer.y.toFixed(0)}`);
});

let ind = 0;
for (const x in window.assets) {
  if (!x.startsWith('fonts/') || x.split('/').length !== 2) continue;
  // new Text(window.assets[x], 200, 100 + ind * 50).setText(x + ': ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz').setColor([ ind * 40, 0, 0 ]).setHoverColor([255, 230, 94]);
  new Text(window.assets[x], 100, 100 + ind * 50).setText(x + ': ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz').setHoverColor([255, 230, 94]);

  ind++;
}