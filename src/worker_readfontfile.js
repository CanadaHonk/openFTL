import FontFile from './fontfile.js';

onmessage = async e => {
  const font = await FontFile.fromBuffer(e.data);

  postMessage({
    chars: font.chars,
    imageData: font.imageData
  });
};