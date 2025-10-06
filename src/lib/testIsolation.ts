export const seed = new Array(10)
  .fill(undefined)
  .map(() => Math.round(Math.random() * 100));
console.log(seed);
