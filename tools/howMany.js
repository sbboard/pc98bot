const fs = require("fs");
const path = require("path");
const dir = "img/";

async function countEm() {
  try {
    const parentDir = path.join(__dirname, "../", dir);
    const files = await fs.promises.readdir(parentDir);
    let fileCount = 0;

    for (let filename of files) {
      const imagesDir = path.join(parentDir, filename);
      const images = await fs.promises.readdir(imagesDir);
      fileCount += images.length;
    }

    const postsPerDay = 6;
    const days = fileCount / postsPerDay;
    const years = days / 364.25;

    console.log("total images:", fileCount);
    console.log("estimated days left:", days);
    console.log("estimated years left:", years);
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

countEm();
