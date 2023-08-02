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

function isGif(imagePath) {
  return imagePath.toLowerCase().indexOf(".gif") != -1;
}

function twitterSafe(imagePath) {
  return !isGif(imagePath) && admin.integrations.twitter;
}

function bskySafe(imagePath) {
  return !isGif(imagePath) && admin.integrations.bsky;
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

async function createMessage(folder, disableHash = true) {
  if (folder == "_unknown") {
    return `unknown // PC-98
If you know the name of this software, please leave a reply.
あなたがこのソフトウェアの名前を知っているならば、答えを残してください`;
  } else {
    const [gameName, company] = folder.split("###");
    if (company) {
      const companyHash = company.replace(/[!@#$'%^()\-&*\[\]\s,.]/g, "");
      return `${gameName} // ${company} // PC-98${
        disableHash ? "" : " // #pc98 #" + companyHash
      }`;
    } else {
      return `${gameName} // PC-98${disableHash ? "" : " // #pc98"}`;
    }
  }
}

async function tweet(folder, imagePath) {
  try {
    const msg = await createMessage(folder, false);
    const mediaId = await client.v1.uploadMedia(imagePath);
    await client.v2.tweet(msg, {
      media: { media_ids: [mediaId] },
    });
    console.log(`Posted ${imagePath} to Twitter`);
    return true;
  } catch (e) {
    console.log("ERROR IN TWITTER POSTING");
    console.log(e);
    return false;
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
    const int8Array = await imageToInt8Array(imagePath);
    const testUpload = await agent.uploadBlob(int8Array, {
      encoding: "image/png",
    });
    const msg = await createMessage(folder);
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
    return true;
  } catch (e) {
    console.log("ERROR IN BSKY POSTING");
    console.log(e);
    return false;
  }
}

async function deleteImg(image_path) {
  try {
    await fs.promises.unlink(image_path);
    console.log(`Deleted image: ${image_path}`);
  } catch (err) {
    console.log("ERROR IN IMAGE DELETION");
    console.log(err);
  }
}

async function deleteFolder(imgLength, folder) {
  try {
    if (imgLength - 1 < 1) {
      await fs.promises.rmdir(path.join(__dirname, admin.imgDir, folder));
      console.log(`Deleted folder: ${folder}`);
    }
  } catch (err) {
    console.log("ERROR IN FOLDER DELETION");
    console.log(err);
  }
}

async function runScript() {
  let imgObj, folderName;
  if (runScript.posting) return;
  try {
    const time = Date.now();
    const lastExecutionTime = runScript.lastExecution || 0;
    const timeDiff = time - lastExecutionTime;
    if (
      (new Date().getHours() % hour === 0 && new Date().getMinutes() === 0) ||
      timeDiff >= hour * 60 * 60 * 1000 ||
      admin.debug
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

      const isTweetSuccess = twitterSafe(imagePath)
        ? await tweet(folderName, imagePath)
        : false;
      const isBskySuccess = bskySafe(imagePath)
        ? await postBsky(folderName, imagePath)
        : false;

      if (isTweetSuccess || isBskySuccess) {
        runScript.lastExecution = time;
        await deleteImg(imagePath);
        await deleteFolder(imgObj.imgLength, folderName);
      } else {
        console.log("ERROR: Failed during tweet or postBsky function");
      }
    }
  } catch (e) {
    console.log("ERROR: Failed during runScript function");
    console.log(`${imgObj ? imgObj.imgName : "undefined"} // ${folderName}`);
    console.log(e);
  } finally {
    runScript.posting = false;
  }
}

let timeInterval = admin.debug ? 10000 : 60000;
setInterval(runScript, timeInterval);
console.log("debug mode:", admin.debug);
