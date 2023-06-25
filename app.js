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
  return new Promise((resolve, reject) => {
    fs.readdir(
      __dirname + admin.imgDir,
      { withFileTypes: true },
      (err, dirents) => {
        if (err) {
          reject(err);
          return;
        }
        const folders = dirents
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name);
        if (folders.length === 0) {
          reject(new Error("No folders found"));
          return;
        }
        const randomFolder =
          folders[Math.floor(Math.random() * folders.length)];
        resolve(randomFolder);
      }
    );
  });
}

function getImage(folder) {
  return new Promise((resolve, reject) => {
    fs.readdir(__dirname + admin.imgDir + folder, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      const { imgName, imgLength } = selectRandomImage(files);
      resolve({ imgName, imgLength });
    });
  });
}

function selectRandomImage(files) {
  if (files.length === 0) {
    throw new Error("No images found");
  }
  const randomIndex = Math.floor(Math.random() * files.length);
  const imgName = files[randomIndex];
  const imgLength = files.length;
  return { imgName, imgLength };
}

async function tweet(folder, image) {
  try {
    const imagePath = path.join(__dirname, admin.imgDir, folder, image);
    let msg = "";
    if (folder == "_unknown") {
      msg = `unknown // PC-98
If you know the name of this software, please leave a reply.
あなたがこのソフトウェアの名前を知っているならば、答えを残してください`;
    } else {
      const [gameName, company] = folder.split("###");
      if (company) {
        const companyHash = company.replace(/[!@#$'%^()\-&*\[\]\s,.]/g, "");
        msg = `${gameName} // ${company} // PC-98 // #pc98 #${companyHash}`;
      } else {
        msg = `${gameName} // PC-98 // #pc98`;
      }
    }
    const mediaId = await client.v1.uploadMedia(imagePath);
    await client.v2.tweet(msg, {
      media: { media_ids: [mediaId] },
    });
    return imagePath;
  } catch (e) {
    throw e;
  }
}

function deleteImg(image_path) {
  return new Promise((resolve, reject) => {
    fs.unlink(image_path, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve("resolved");
      }
    });
  });
}

function deleteFolder(imgLength, folder) {
  return new Promise((resolve, reject) => {
    if (imgLength - 1 < 1) {
      fs.rmdir(__dirname + admin.imgDir + folder, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`deleted ${folder} folder`);
          resolve("resolved");
        }
      });
    } else {
      resolve("resolved");
    }
  });
}

async function runScript() {
  let imgObj, folderName;
  try {
    const time = new Date();
    if (
      (time.getHours() % hour == 0 && time.getMinutes() == 0) ||
      admin.debug
    ) {
      folderName = await getFolder();
      imgObj = await getImage(folderName);
      const filepath = await tweet(folderName, imgObj.imgName);
      await deleteImg(filepath);
      await deleteFolder(imgObj.imgLength, folderName);
      console.log(`Posted ${imgObj.imgName} from ${folderName} folder`);
    }
  } catch (e) {
    console.log("ERROR: Failed during runScript function");
    console.log(`${imgObj ? imgObj.imgName : "undefined"} // ${folderName}`);
    console.log(e);
    return;
  }
}

let timeInterval = admin.debug ? 10000 : 60000;
setInterval(runScript, timeInterval);
console.log("admin mode:", admin.debug);
