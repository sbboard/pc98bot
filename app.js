var Twit = require('twit')

var fs = require('fs'),
    path = require('path'),
    Twit = require('twit'),
    config = require(path.join(__dirname, 'config.js'));

let admin = {
  time: 5*60*60*1000,
  imgDir: '/tempimg/'
}

var T = new Twit(config);

function random_from_array(images){
     return images[Math.floor(Math.random() * images.length)];
}

function upload_random_image(){
  let images = []
  let folders = []
  let currentFolder = 0
  var image_path = ""
  let b64content = ""

  fs.readdirSync(__dirname + admin.imgDir).filter(function (file) {
      folders.push(file)
  })

  currentFolder = Math.floor(Math.random() * folders.length)

  fs.readdir(__dirname + admin.imgDir + folders[currentFolder] + "/", function(err, files){
    files.forEach(function(f) {
      images.push(f);
    })
    image_path = path.join(__dirname, admin.imgDir + folders[currentFolder] + "/" + random_from_array(images))
    b64content = fs.readFileSync(image_path, { encoding: 'base64' });


    console.log('Uploading image...');

    T.post('media/upload', { media_data: b64content }, function (err, data, response) {
      if (err){
        console.log('ERROR:');
        console.log(err);
      }
      else{
        console.log('Upload Image!');
        console.log('Tweeting...');
  
        T.post('statuses/update', {
          media_ids: new Array(data.media_id_string),
          status: `${folders[currentFolder]} - PC-98`
        },
          function(err, data, response) {
            if (err){
              console.log('ERROR:');
              console.log(err);
            }
            else{
              console.log('Posted!');
            }
          }
        );
      }
    })
    //delete image
    // fs.unlink(image_path, function(err){
    //      if (err){
    //        console.log('ERROR: unable to delete image ' + image_path);
    //      }
    //      else{
    //        console.log('img ' + image_path + ' was deleted');
    //      }
    //    });
    //check to see if directory is empty, then delete it
  })
}

//This is the kush
//setInterval(function(){
  upload_random_image();
//}, admin.time);