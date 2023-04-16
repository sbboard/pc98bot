const fs = require("fs"),
  Twit = require("twit"),
  path = require("path"),
  config = require(path.join(__dirname, "config.js")),
  T = new Twit(config),
  archive = require("./archive/tweet.js"),
  hour = 4, //4 for normal, 1 for hourly
  retweetEvery = 5, //0 for every time, 5 for normal
  admin = {
    imgDir: "/img/",
    debug: true,
  };
let counter = 1;

//get how many images are left
async function getCount() {
  const promise = new Promise((resolve) => {
    fs.readdir(__dirname + admin.imgDir, (err, files) => resolve(files.length));
  });
  return await promise;
}

function getFolder() {
  return new Promise((resolve) => {
    const folders = fs.readdirSync(__dirname + admin.imgDir).filter((f) => {
      return fs.statSync(__dirname + admin.imgDir + "/" + f).isDirectory();
    });
    resolve(folders[Math.floor(Math.random() * folders.length)]);
  });
}

function getImage(folder) {
  return new Promise((resolve) => {
    let images = [];
    fs.readdirSync(__dirname + admin.imgDir + folder + "/").forEach((file) =>
      images.push(file)
    );
    resolve({
      imgName: images[Math.floor(Math.random() * images.length)],
      imgLength: images.length,
    });
  });
}

function tweet(folder, image) {
  return new Promise((resolve) => {
    let image_path = path.join(__dirname, admin.imgDir + folder + "/" + image);
    const b64content = fs.readFileSync(image_path, { encoding: "base64" });
    let msg = "";
    if (folder == "_unknown") {
      msg = `unknown // PC-98
If you know the name of this software, please leave a reply!
あなたがこのソフトウェアの名前を知っているならば、答えを残してください`;
    } else {
      const gameName = folder.split("###")[0],
        company = folder.split("###")[1],
        company_hash = company.replace(/[!@#$'%^()\-&*\[\]\s,.]/g, "");
      msg = `${gameName} // ${company} // PC-98 // #pc98 #${company_hash}`;
    }
    console.log("Uploading image...");
    T.post("media/upload", { media_data: b64content }, (err, data) => {
      if (err) console.log("ERROR:", err);
      else {
        console.log("Uploaded Image!");
        const mid = new Array(data.media_id_string);
        T.post("statuses/update", { media_ids: mid, status: msg }, (err) => {
          if (err) console.log("ERROR:", err);
          else console.log("Posted!");
          resolve(image_path);
        });
      }
    });
  });
}

function deleteImg(image_path) {
  return new Promise((resolve) => {
    fs.unlink(image_path, (err) => {
      if (err) console.log("ERROR: unable to delete image " + image_path);
      else console.log("img " + image_path + " was deleted");
      resolve("resolved");
    });
  });
}

function deleteFolder(imgLength, folder) {
  return new Promise((resolve) => {
    if (imgLength - 1 < 1) {
      fs.rmdir(__dirname + admin.imgDir + folder, () => {
        console.log(`deleted ${folder} folder`);
        resolve("resolved");
      });
    } else resolve("resolved");
  });
}

function postRT(RTID) {
  T.post("statuses/retweet/:id", { id: RTID }, (err, response) => {
    if (response) console.log("retweeted");
    if (err) {
      if (err.code == 327) {
        //untweet
        T.post("statuses/unretweet/:id", { id: RTID }, (err, response) => {
          if (response) postRT(RTID);
          if (err) console.log(err);
        });
      } else if (err.code == 144) retweet();
      else console.log(err);
    }
  });
}

async function retweet() {
  const archiveLength = archive.length;
  const rand = Math.floor(Math.random() * archiveLength);
  if (archive[rand].tweet.entities.hashtags.some((i) => i.text === "pc98")) {
    postRT(archive[rand].tweet.id);
  } else retweet();
}

async function runScript() {
  const time = new Date();
  if ((time.getHours() % hour == 0 && time.getMinutes() == 0) || admin.debug) {
    getCount().then(async function (numOfGames) {
      if (numOfGames > 0 && counter < retweetEvery) {
        const folderName = await getFolder();
        const imgObj = await getImage(folderName);
        const filepath = await tweet(folderName, imgObj.imgName);
        await deleteImg(filepath);
        await deleteFolder(imgObj.imgLength, folderName);
        counter++;
      } else {
        retweet();
        counter = 1;
      }
    });
  }
}

let timeInterval = admin.debug ? 10000 : 60000;
setInterval(runScript, timeInterval);
console.log("admin mode:", admin.debug);
