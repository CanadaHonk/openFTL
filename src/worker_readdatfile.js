import DatFile from './datfile.js';

onmessage = async e => {
  const dat = DatFile.fromBuffer(e.data);
  // console.log(dat);

  /* const promises = [];

  for (const entry of dat.entries) {
    promises.push(dat.getEntryBitmap(entry));
  }

  await Promise.all(promises); */

  postMessage({ type: 'done', entries: dat.entries });
};