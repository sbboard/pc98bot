const fs = require("fs");
const { promisify } = require("util");
const path = require("path");

const readdir = promisify(fs.readdir);
const appendFile = promisify(fs.appendFile);

const dir = path.join(__dirname, "..", "img");

function containsNP2(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].startsWith("NP2")) return true;
  }
  return false;
}

async function main() {
  const folders = await readdir(dir, { withFileTypes: true });
  const gameList = [];

  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    const files = await readdir(path.join(dir, folder.name));
    if (!containsNP2(files)) continue;
    const splitName = folder.name.split("###");
    gameList.push([splitName[1], splitName[0]].join(" / "));
  }

  const sortedList = gameList.sort();
  for (const game of sortedList) {
    await appendFile("gameList.txt", `${game}\r\n`);
  }
}

main().catch((err) => console.error(err));
