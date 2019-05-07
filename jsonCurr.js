let fs = require('fs')
let path = require('path')
let json = ""
let fileList = []
json = "["

fs.readdirSync("img").forEach(file => {
    fileList.push(file)
});

for(let i=0;i<fileList.length;i++){
    json += `{
    "filename":"${fileList[i]}",
      "source":"",
      "game":"",
      "year":""
  }
  `
  if(i!=fileList.length-1){
      json +=","
  }
}
json += "]"

fs.writeFile('imgList.json', json, function (err) {
    if (err) throw err;
    console.log('JSON Created');
})