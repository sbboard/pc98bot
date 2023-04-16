const { TwitterApi } = require("twitter-api-v2");

const fs = require("fs"),
  path = require("path"),
  config = require(path.join(__dirname, "config.js")),
  client = new TwitterApi(config),
  hour = 4, //4 for normal, 1 for hourly
  admin = {
    imgDir: "/img/",
    debug: false,
  };

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

async function tweet(folder, image) {
  let image_path = path.join(__dirname, admin.imgDir + folder + "/" + image);
  let msg = "";
  if (folder == "_unknown") {
    msg = `unknown // PC-98
If you know the name of this software, please leave a reply.
あなたがこのソフトウェアの名前を知っているならば、答えを残してください`;
  } else {
    const gameName = folder.split("###")[0],
      company = folder.split("###")[1],
      company_hash = company.replace(/[!@#$'%^()\-&*\[\]\s,.]/g, "");
    msg = `${gameName} // ${company} // PC-98 // #pc98 #${company_hash}`;
  }
  const mediaId = await client.v1.uploadMedia(image_path);
  await client.v2.tweet(msg, {
    media: { media_ids: [mediaId] },
  });
  console.log("posted", image_path);
  return new Promise((resolve) => resolve(image_path));
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

async function runScript() {
  const time = new Date();
  if ((time.getHours() % hour == 0 && time.getMinutes() == 0) || admin.debug) {
    const folderName = await getFolder();
    const imgObj = await getImage(folderName);
    const filepath = await tweet(folderName, imgObj.imgName);
    await deleteImg(filepath);
    await deleteFolder(imgObj.imgLength, folderName);
  }
}

let timeInterval = admin.debug ? 10000 : 60000;
setInterval(runScript, timeInterval);
console.log("admin mode:", admin.debug);
