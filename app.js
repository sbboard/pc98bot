var Twit = require('twit')

var fs = require('fs'),
    path = require('path'),
    Twit = require('twit'),
    config = require(path.join(__dirname, 'config.js'));

const hour = 4

let admin = {
  time: hour*60*60*1000,
  imgDir: '/img/',
  hashtagNotifier: '###'
}

let fileCount = 0
let postsPerDay = 24 / hour

//get how many images are left
fs.readdir(__dirname + admin.imgDir, (err, files) => {
  let folderAmt = files.length
  for(let v=0;v<folderAmt;v++){
    fs.readdir(__dirname + admin.imgDir + files[v], (err, filesTwo) => {
        fileCount += (filesTwo.length)
      });
  }
});

var T = new Twit(config);

//get folder
function getFolder(){
  return new Promise(resolve => {
    let currentFolder = 0
    let folders = fs.readdirSync(__dirname + admin.imgDir).filter(function (file) {
      return fs.statSync(__dirname + admin.imgDir+'/'+file).isDirectory();
    })
    currentFolder = Math.floor(Math.random() * folders.length)
    resolve(folders[currentFolder])
  })
}

//get image
function getImage(folder){
  return new Promise(resolve => {
    let images = []
    let currentImg = 0

    fs.readdirSync(__dirname + admin.imgDir + folder + "/").filter(function(file){
        images.push(file);
    })
    currentImg = Math.floor(Math.random() * images.length)
    resolve({
      imgName: images[currentImg],
      imgLength: images.length
    })
  })
}

//tweet
function tweet(folder, image){
  return new Promise(resolve => {
    let image_path = ""
    let b64content = ""
    let msg = ""
    
    image_path = path.join(__dirname, admin.imgDir + folder + "/" + image)
    b64content = fs.readFileSync(image_path, { encoding: 'base64' });

    if(folder == "_unknown"){
      msg = `unknown // PC-98
If you know the name of this software, please leave a reply!
あなたがこのソフトウェアの名前を知っているならば、答えを残してください`
    }
    else{
      if(folder.includes(admin.hashtagNotifier)){
        let gameName = folder.split('###')[0]
        let company = folder.split('###')[1]
        msg = `${gameName} // ${company} // PC-98 // #pc98 #${company.replace(/[^a-zA-Z]/g, "")}`
      }
      else{
        msg = `${folder} // PC-98 // #pc98`
      }
    }
    console.log('Uploading image...');

    T.post('media/upload', { media_data: b64content }, function (err, data, response) {
      if (err){
        console.log('ERROR:');
        console.log(err);
      }
      else{
        console.log('Uploaded Image!');
        console.log('Tweeting...');

        T.post('statuses/update', {
          media_ids: new Array(data.media_id_string),
          status: msg
        },
          function(err, data, response) {
            if (err){
              console.log('ERROR:');
              console.log(err);
            }
            else{
              console.log('Posted!');
            }
            resolve(image_path)
          }
        );
      }
    })
  })
}

//delete image
function deleteImg(image_path){
  return new Promise(resolve => {
    fs.unlink(image_path, function(err){
      if (err){
        console.log('ERROR: unable to delete image ' + image_path);
      }
      else{
        console.log('img ' + image_path + ' was deleted');
      }
      resolve('resolved')
    });
  })
}

//delete folder
function deleteFolder(imgLength, folder){
  return new Promise(resolve => {
    if(imgLength - 1 < 1){
      fs.rmdir(__dirname + admin.imgDir + folder, () => {
        console.log(`deleted ${folder} folder`)
        resolve('resolved')
      })
    }
    else{
      resolve('resolved')
    }
  })
}

async function runScript(){
  let folderName = await getFolder()
  let imgObj = await getImage(folderName)
  let filepath = await tweet(folderName, imgObj.imgName)
  let daysLeft = 0 
  fileCount = fileCount-1
  daysLeft = fileCount / postsPerDay
  console.log((daysLeft/365).toFixed(2) + " years left (" + daysLeft.toFixed(2) + " days)")
  await deleteImg(filepath)
  await deleteFolder(imgObj.imgLength, folderName)
}

//Initiate
setInterval(function(){
  runScript()
}, admin.time);