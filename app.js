var Twit = require('twit')

var fs = require('fs'),
    path = require('path'),
    Twit = require('twit'),
    config = require(path.join(__dirname, 'config.js'));

let admin = {
  time: 5*60*60*1000,
  imgDir: '/img/'
}

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

    if(folder == "unknown"){
      msg = "PC-98 game name unknown. If you know the name of this game, please leave a reply!"
    }
    else{
      msg = `${folder} // PC-98`
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
  await deleteImg(filepath)
  await deleteFolder(imgObj.imgLength, folderName)
}

//Initiate
setInterval(function(){
  runScript()
}, admin.time);