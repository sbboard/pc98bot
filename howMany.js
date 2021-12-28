const fs = require("fs");
const dir = "/img/";

async function countEm() {
  let fileCount = 0;
  fs.promises
    .readdir(__dirname + dir)
    .then(async (result) => {
      for (let filename of result) {
        images = await fs.promises.readdir(__dirname + dir + filename);
        fileCount += images.length;
      }
    })
    .finally(() => {
      let days = fileCount / 5;
      let years = days / 364.25;
      console.log("total images:", fileCount);
      console.log("estimated days left:", days);
      console.log("estimated years left:", years);
    });
}

countEm();
