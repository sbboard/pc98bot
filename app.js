var Twit = require('twit')
var fs = require('fs'),
    path = require('path'),
    Twit = require('twit'),
    config = require(path.join(__dirname, 'config.js'));
var T = new Twit(config);
const axios = require('axios');

Date.prototype.addMonths = function(months) {
  var date = new Date(this.valueOf());
  date.setMonth(date.getMonth() + months)
  return date
}

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

//4 for normal, 1 for hourly
const hour = 4
const minute = 0
let counter = 1

//0 for every time, 5 for normal, 999 for pretty much never
const retweetEvery = 9999999

let admin = {
  imgDir: '/img/',
  hashtagNotifier: '###',
  debug: false
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
        msg = `${gameName} // ${company} // PC-98 // #pc98 #${company.replace(/[!@#$%^\-&*\[\]\s,.]/g, "")}`
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
function postRT(RTID){
    T.post('statuses/retweet/:id', {
      id: RTID
    }, function (err, response) {
      if (response) {
        console.log("retweeted")
      }
      if (err) {
        if(err.code==327){
          //untweet
          T.post('statuses/unretweet/:id', {
            id: RTID
          }, function (err, response) {
            if(response) {
              console.log("unretweeted")
              postRT(RTID)
            }
            if(err){
              console.log(err)
            }
          })
          //
        }
        else{
          console.log(err)
        }
      }
  });
}

async function retweet(){
  //formats date for twitter URL
  function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
  
    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
  
    return [year, month, day].join('-');
  }
  
  //randomly selects dates
  let start = new Date(2019, 6, 3)
  let today = new Date
  let sixMonthsAgo = today.addMonths(-6)
  let randomDate = new Date(start.getTime() + Math.random() * (sixMonthsAgo.getTime() - start.getTime()))
  let nextDay = (randomDate.addDays(1))
  
  //the HTML scraper
  async function getHTML(uri) {
    const response = await axios.get(uri);
    let arrayOfStuff = response.data.split(`data-url="https://twitter.com/PC98_bot/status/`)
    let blankArray = []
    let randomIndex
    for(let i =1;i<arrayOfStuff.length;i++){
      blankArray.push(arrayOfStuff[i].split("/photo/1")[0])
    }
    randomIndex = Math.floor(Math.random() * blankArray.length);
    console.log(`retweet found: ${blankArray[randomIndex]}`)
    postRT(blankArray[randomIndex])
  }

  getHTML(`https://mobile.twitter.com/search?q=(%23pc98)%20(from%3Apc98_bot)%20until%3A${formatDate(nextDay)}%20since%3A${formatDate(randomDate)}&src=typed_query`)
}

async function runScript(){
  var time = new Date()
  var h = time.getHours()
  var m = time.getMinutes()
  if((h%hour==0&&parseInt(m)==minute)||admin.debug == true){
    let theCount = getCount()
    theCount.then(async function(numOfGames) {
    if(numOfGames > 0 && counter < retweetEvery){
      let folderName = await getFolder()
      let imgObj = await getImage(folderName)
      let filepath = await tweet(folderName, imgObj.imgName)
      await deleteImg(filepath)
      await deleteFolder(imgObj.imgLength, folderName)
      counter++
    }
    else{
      retweet()
      counter = 1
    }
  })
  }
}

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