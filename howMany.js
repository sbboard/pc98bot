const fs = require('fs');
const dir = '/img/';
let fileCount = 0

fs.readdir(__dirname + dir, (err, files) => {
  let folderAmt = files.length
  for(let v=0;v<folderAmt;v++){
    fs.readdir(__dirname + dir+ files[v], (err, filesTwo) => {
        fileCount += (filesTwo.length)
      });
  }
});