import Pointer from './pointer.js';

const pointer = new Pointer({
  invalid: window.assets['img/mouse/pointerInvalid.png'],
  valid: window.assets['img/mouse/pointerValid.png']
});

window.objects = [];

window.WIDTH = 1280;
window.HEIGHT = 720;

canvas.width = WIDTH;
canvas.height = HEIGHT;

window.SCALE_MODE = 'none'; // borders | stretch | none
window.UPSCALE_MODE = 'blurry'; // blurry | pixelated

const setCanvasStyle = () => {
  canvas.style.objectFit = '';
  canvas.style.width = '';
  canvas.style.height = '';

  if (SCALE_MODE === 'borders') {
    canvas.style.objectFit = 'contain';
  }

  if (SCALE_MODE === 'none') {
    canvas.style.width = WIDTH + 'px';
    canvas.style.height = HEIGHT + 'px';
  }

  canvas.style.imageRendering = UPSCALE_MODE === 'blurry' ? '' : 'pixelated';
};
window.setCanvasStyle = setCanvasStyle;

dat.remove();
info.remove();

document.body.style.background = '#000000';
canvas.style.display = 'block';
document.body.style.alignItems = 'center';

setCanvasStyle();

window.ctx = canvas.getContext('2d');

const getDisplaySize = () => {
  if (SCALE_MODE === 'stretch') return [
    window.innerWidth,
    window.innerHeight
  ];

  if (SCALE_MODE === 'none') return [ WIDTH, HEIGHT ];

  let ratio = WIDTH / HEIGHT;
  let width = window.innerHeight * ratio;

  let height = window.innerHeight;
  if (width > window.innerWidth) {
    width = window.innerWidth;
    height = window.innerWidth / ratio;
  }

  return [ width, height ];
}

const scaleMouse = e => {
  if (SCALE_MODE === 'stretch') {
    return [
      e.clientX * (WIDTH / window.innerWidth),
      e.clientY * (HEIGHT / window.innerHeight)
    ];
  }

  const [ displayWidth, displayHeight ] = getDisplaySize();

  const offsetX = (window.innerWidth - displayWidth) / 2;
  const offsetY = (window.innerHeight - displayHeight) / 2;

  // console.log([ (e.clientX - offsetX) * (WIDTH / displayWidth), (e.clientY - offsetY) * (HEIGHT / displayHeight) ]);

  // console.log(window.innerWidth, displayWidth);
  // console.log(window.innerHeight, displayHeight);

  // borders
  return [
    (e.clientX - offsetX) * (WIDTH / displayWidth),
    (e.clientY - offsetY) * (HEIGHT / displayHeight)
  ];
}

let lastHoveredAny = false;
const checkMouseForObjects = e => {
  const [ pX, pY ] = scaleMouse(e);
  lastMousePos = [ pX, pY ];

  lastHoveredAny = false;
  for (const x of window.objects) {
    x.hovering = false;
    x.clicking = false;
  }

  for (const x of window.objects) {
    const bounding = x.getBoundingBox?.();
    if (!bounding) continue;

    if (pX >= bounding[0] && pY >= bounding[1] && pX <= bounding[2] && pY <= bounding[3]) {
      lastHoveredAny = true;

      x.hovering = [ pX, pY ];

      if (e.buttons !== 0) {
        x.clicking = true;
        x.onClick?.([ pX, pY ]);
      }

      break;
    }
  }
};

window.pressing = {};
let lastMousePos = [ 0, 0 ];
document.onmousedown = e => {
  checkMouseForObjects(e);
  pressing['mouse' + e.button] = true;

  e.preventDefault();
  return false;
};

document.onmousemove = e => {
  checkMouseForObjects(e);

  e.preventDefault();
  return false;
};

document.onmouseup = e => {
  checkMouseForObjects(e);
  pressing['mouse' + e.button] = false;

  e.preventDefault();
  return false;
};

document.onkeydown = e => {
  pressing[e.key] = true;

  if (e.key === 'Escape') {
    if (optionsWindow) optionsWindow.close();
  }
};

document.onkeyup = e => {
  pressing[e.key] = false;
};

let fpsFrameCount = 0, fpsLastUpdate = 0, fps = 0;
const fpsAcc = 3;

window.hooks = [];
let lastFrame = performance.now();
const loop = () => {
  const frameTimeStart = performance.now();
  const deltaTime = frameTimeStart - lastFrame;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < objects.length; i++) {
    if (objects[i].inOptionsWindow === true && !objects[i].objs) continue;
    objects[i].draw();
  }

  pointer.x = lastMousePos[0];
  pointer.y = lastMousePos[1];

  let asset = 'invalid';
  if (lastHoveredAny) asset = 'valid';
  pointer.asset = asset;

  pointer.draw();

  fpsFrameCount++;
  if (performance.now() > fpsLastUpdate + 1000 / fpsAcc) {
    fps = fpsFrameCount * fpsAcc;
    fpsLastUpdate = performance.now();
    fpsFrameCount = 0;
  }

  hooks.forEach(x => x(pointer, fps));

  lastFrame = performance.now();
  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);