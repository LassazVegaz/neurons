const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

for (let i = 1; i <= 10; i++) {
  self.postMessage(i);
  await sleep(1000);
}
