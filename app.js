const { TwitterApi } = require("twitter-api-v2");
const { BskyAgent } = require("@atproto/api");

const fs = require("fs"),
  path = require("path"),
  config = require(path.join(__dirname, "config.js")),
  bskyConfig = require(path.join(__dirname, "bsky_config.js")),
  client = new TwitterApi(config),
  hour = 4, //4 for normal, 1 for hourly
  admin = {
    imgDir: "/img/",
    debug: false,
    integrations: {
      twitter: true,
      bsky: true,
    },
  };

function twitterSafe() {
  return admin.integrations.twitter;
}

function bskySafe(imagePath) {
  return (
    imagePath.toLowerCase().indexOf(".gif") == -1 && admin.integrations.bsky
  );
}

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

async function tweet(folder, imagePath) {
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

  try {
    const mediaId = await client.v1.uploadMedia(imagePath);
    await client.v2.tweet(msg, {
      media: { media_ids: [mediaId] },
    });
    console.log(`Posted ${imagePath} to Twitter`);
    return "resolved";
  } catch (e) {
    console.log("ERROR IN TWITTER POSTING");
    return "resolved";
  }
}

async function imageToInt8Array(imagePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      const int8Array = new Int8Array(data);
      resolve(int8Array);
    });
  });
}

async function postBsky(folder, imagePath) {
  try {
    const agent = new BskyAgent({ service: "https://bsky.social" });
    await agent.login(bskyConfig);
    const int8Array = await imageToInt8Array(imagePath); // Await the imageToInt8Array function
    const testUpload = await agent.uploadBlob(int8Array, {
      encoding: "image/png",
    });
    let msg = "";
    if (folder == "_unknown") {
      msg = `unknown // PC-98
If you know the name of this software, please leave a reply.
あなたがこのソフトウェアの名前を知っているならば、答えを残してください`;
    } else {
      const [gameName, company] = folder.split("###");
      if (company) {
        msg = `${gameName} // ${company} // PC-98`;
      } else {
        msg = `${gameName} // PC-98`;
      }
    }
    await agent.post({
      text: msg,
      embed: {
        images: [
          {
            image: testUpload.data.blob,
            alt: msg,
          },
        ],
        $type: "app.bsky.embed.images",
      },
    });
    console.log(`Posted ${imagePath} to Bluesky`);
    return "resolved";
  } catch (e) {
    console.log("ERROR IN BSKY POSTING");
    return "resolved";
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
    const time = Date.now();
    const lastExecutionTime = runScript.lastExecution || 0;
    const timeDiff = time - lastExecutionTime;
    if (
      ((new Date().getHours() % hour === 0 && new Date().getMinutes() === 0) ||
        timeDiff >= hour * 60 * 60 * 1000 ||
        admin.debug) &&
      !runScript.posting
    ) {
      runScript.posting = true;
      folderName = await getFolder();
      imgObj = await getImage(folderName);
      const imagePath = path.join(
        __dirname,
        admin.imgDir,
        folderName,
        imgObj.imgName
      );
      if (twitterSafe()) await tweet(folderName, imagePath);
      if (bskySafe(imagePath)) await postBsky(folderName, imagePath);
      await deleteImg(imagePath);
      await deleteFolder(imgObj.imgLength, folderName);
      runScript.lastExecution = time;
    }
  } catch (e) {
    console.log("ERROR: Failed during runScript function");
    console.log(`${imgObj ? imgObj.imgName : "undefined"} // ${folderName}`);
    console.log(e);
    return;
  } finally {
    runScript.posting = false;
  }
}

let timeInterval = admin.debug ? 10000 : 60000;
setInterval(runScript, timeInterval);
console.log("admin mode:", admin.debug);
