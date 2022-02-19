export type Data = {width: number; height: number};
addEventListener('message', (data: MessageEvent<Data>) => {
  const {width, height} = data.data;

  let res = 0;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let index = (x + (y * width));
      res += index;
    }
  }
  
  postMessage(res);
});
