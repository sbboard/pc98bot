const fs = require("fs");
const { promisify } = require("util");
const path = require("path");

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const appendFile = promisify(fs.appendFile);

const dir = path.join(__dirname, "..", "img");

async function main() {
  const folders = await readdir(dir, { withFileTypes: true });

  for (const folder of folders) {
    if (folder.isDirectory()) {
      const files = await readdir(path.join(dir, folder.name));

      for (const file of files) {
        const filepath = path.join(dir, folder.name, file);
        const filesize = (await stat(filepath)).size;
        const fileMB = filesize / (1024 * 1024);

        console.log(fileMB);

        if (fileMB >= 5) {
          await appendFile("theList.txt", `${folder.name}/${file}\r\n`);
          console.log("Saved!");
        }
      }
    }
  }
}

main().catch((err) => console.error(err));
