//this tool was made to create a list of files too big to upload on twitter

let fs = require('fs')
const dir = '/img/';

fs.readdir(__dirname + dir, (err, files) => {
    let folderAmt = files.length

    //scan folders
    for(let v=0;v<folderAmt;v++){
    //go through each folder
      fs.readdir(__dirname + dir+ files[v], (err, filesTwo) => {
          for(let x=0;x<filesTwo.length;x++){
              let filesize = fs.statSync(`img/${files[v]}/${filesTwo[x]}`).size
              var fileMB = filesize / (1024*1024);
              console.log(fileMB)
              if(fileMB >= 25){
                  fs.appendFile('theList.txt', `${files[v]}/${filesTwo[x]}\r\n`, function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                  });
              }
          }
        });
    }
});