import DatFile from './datfile.js';

window.VERSION = `0.0.1`;
name_version.textContent = VERSION;

let start;
const readDatFile = buffer => new Promise(resolve => {
  const worker = new Worker('src/worker_readdatfile.js', { type: 'module' });

  const exts = {};
  worker.onmessage = e => {
    const { data } = e;

    switch (data.type) {
      case 'done':
        reading_phase.textContent = `Read file in ${((performance.now() - start) / 1000).toFixed(2)}s!`;
        worker.terminate();
        return resolve(DatFile.fromEntries(data.entries));

      case 'progress':
        reading.max = data.outOf - 1;
        reading.value = data.current;

        if (data.ext) {
          exts[data.ext] = (exts[data.ext] ?? 0) + 1;
          reading_stats.textContent = Object.keys(exts).map(x => `${x}: ${exts[x]}`).join('\n');
        }

        if (data.phase === 1) reading_phase.textContent = 'Getting entries...';
        if (data.phase === 2) reading_phase.textContent = 'Reading entry paths...';
        if (data.phase === 3) reading_phase.textContent = 'Reading entries...';

        break;
    }
  };

  worker.postMessage(buffer);
});

const readFontFile = entry => new Promise(resolve => {
  const worker = new Worker('src/worker_readfontfile.js', { type: 'module' });

  worker.onmessage = e => {
    entry.font = e.data;
    resolve(e.data);
  };

  worker.postMessage(entry.data);
});

file.onchange = () => {
  reading_dat.style.opacity = '1';
  start = performance.now();

  const reader = new FileReader();
  reader.onload = async () => {
    const datFile = await readDatFile(reader.result);

    // document.body.style.display = 'block';

    reading_phase.textContent = `Loading images...`;
    await new Promise(res => setTimeout(res, 1));

    // let i = 0;
    for (const x of datFile.entries) {
      if (x.type === 'png') {
        // preload <img>s
        datFile.getEntryImg(x);

        // reading.value = ++i;
        // await new Promise(res => setTimeout(res, 0));
      }
    }

    reading_phase.textContent = `Loading XML...`;
    await new Promise(res => setTimeout(res, 1));

    let i = 0;
    reading.max = datFile.entries.reduce((acc, x) => acc + (x.type === 'xml' ? 1 : 0), 0);
    reading.value = i;

    for (const x of datFile.entries) {
      if (x.type === 'xml') {
        // pre-parse XML files
        datFile.getEntryXML(x);

        reading.value = ++i;
      }
    }

    reading_phase.textContent = `Loading fonts...`;

    i = 0;
    reading.max = datFile.entries.reduce((acc, x) => acc + (x.type === 'font' ? 1 : 0), 0);
    reading.value = i;

    await new Promise(res => setTimeout(res, 1));

    const fontPromises = [];
    for (const x of datFile.entries) {
      if (x.type === 'font' && x.path.split('/').length === 2) {
        // pre-load font files
        fontPromises.push(readFontFile(x));
        fontPromises[fontPromises.length - 1].then(() => reading.value = ++i);
      }
    }

    await Promise.all(fontPromises);

    const Asset = (await import('./engine/asset.js')).default;

    window.assets = {};
    for (const x of datFile.entries) {
      assets[x.path] = new Asset(datFile, x);
    }

    reading_phase.textContent = `Loaded in ${((performance.now() - start) / 1000).toFixed(2)}s!`;

    await new Promise(res => setTimeout(res, 10));

    // load game logic
    await import('./engine/loop.js');

    await new Promise(res => setTimeout(res, 10));

    // make canvas active
    canvas.style.zIndex = 1;

    // load title
    await import('./scenes/title.js');

    // const dat = new DatFile(reader.result);
    // console.log(reader.result);
  };

  reader.readAsArrayBuffer(file.files[0]);
};