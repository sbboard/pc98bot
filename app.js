var Twit = require('twit')
var fs = require('fs'),
    path = require('path'),
    Twit = require('twit'),
    config = require(path.join(__dirname, 'config.js'));
var T = new Twit(config);

const hour = 4
const minute = 0
let counter = 0
const retweetEvery = -1
let postsPerDay = 24 / hour

let admin = {
  imgDir: '/img/',
  hashtagNotifier: '###',
  debug: true
}

//get how many images are left
async function getCount(){
  let promise = new Promise(resolve => {
    fs.readdir(__dirname + admin.imgDir, (err, files) => {
      let folderAmt = files.length
      resolve(folderAmt)
    })
  })
  let result = await promise
  return result
}

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
  var time = new Date()
  var h = time.getHours()
  var m = time.getMinutes()
  if((h%hour==0&&parseInt(m)==minute)||admin.debug == true){
    let theCount = getCount()
    theCount.then(async function(numOfGames) {
    if(numOfGames > 0 && counter <= retweetEvery){
      let folderName = await getFolder()
      let imgObj = await getImage(folderName)
      let filepath = await tweet(folderName, imgObj.imgName)
      await deleteImg(filepath)
      await deleteFolder(imgObj.imgLength, folderName)
      counter++
      console.log(counter)
    }
    else{
      console.log("retweet")
      counter = 0
    }
  })
  }
}

//Initiate (runs every minute)
if(admin.debug == true){
  setInterval(function(){
    runScript()
  }, 10000);
  console.log("admin mode on")
}
else{
  setInterval(function(){
    runScript()
  }, 60000);
  console.log("normal mode on")
}