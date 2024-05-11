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
  },
  killImg = "killscreen.png",
  killCopy = !admin.debug
    ? "No more images in queue. PC-98 Bot prime directive complete. Thank you for playing. Shutting down."
    : "Test string 2";

function isGif(imagePath) {
  return imagePath.toLowerCase().indexOf(".gif") != -1;
}

function twitterSafe(imagePath) {
  return !isGif(imagePath) && admin.integrations.twitter;
}

function bskySafe(imagePath) {
  return !isGif(imagePath) && admin.integrations.bsky;
}

let folders: string[] = [];
async function getFolder() {
  if (folders.length === 0) folders = await readFolders();
  return new Promise((resolve, reject) => {
    const randomFolder = folders[Math.floor(Math.random() * folders.length)];
    resolve(randomFolder);
  });
}

// Read folders in img directory
async function readFolders(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(
      __dirname + admin.imgDir,
      { withFileTypes: true },
      (err, dirents) => {
        if (err) {
          reject(err);
          return;
        }
        folders = dirents
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name);
        resolve(folders);
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
  const [gameName, company] = folder.split("###");
  if (!company) return `${gameName} // PC-98${disableHash ? "" : " // #pc98"}`;
  const companyHash = company.replace(/[!@#$'%^()\-&*\[\]\s,.]/g, "");
  return `${gameName} // ${company} // PC-98${
    disableHash ? "" : " // #pc98 #" + companyHash
  }`;
}

async function tweet(folder, imagePath, killscreen = false) {
  try {
    const msg = !killscreen
      ? await createMessage(folder, admin.debug)
      : killCopy;
    const img = !killscreen ? imagePath : `${__dirname}/${killImg}`;
    const mediaId = await client.v1.uploadMedia(img);
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

async function postBsky(folder, imagePath, killscreen = false) {
  try {
    const agent = new BskyAgent({ service: "https://bsky.social" });
    await agent.login(bskyConfig);
    const img = !killscreen ? imagePath : `${__dirname}/${killImg}`;
    const int8Array = await imageToInt8Array(img);
    const testUpload = await agent.uploadBlob(int8Array, {
      encoding: "image/png",
    });
    const msg = !killscreen ? await createMessage(folder) : killCopy;
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
      folders = folders.filter((f) => f !== folder);
      await fs.promises.rmdir(path.join(__dirname, admin.imgDir, folder));
      console.log(`Deleted folder: ${folder}`);
    }
  } catch (err) {
    console.log("ERROR IN FOLDER DELETION");
    console.log(err);
  }
}

let posting = false;
let lastExecution = 0;
async function runScript() {
  let imgObj, folderName;
  if (posting) return;
  try {
    const time = Date.now();
    const lastExecutionTime = lastExecution || 0;
    const timeDiff = time - lastExecutionTime;
    if (
      (new Date().getHours() % hour === 0 && new Date().getMinutes() === 0) ||
      timeDiff >= hour * 60 * 60 * 1000 ||
      admin.debug
    ) {
      posting = true;
      folderName = await getFolder();

      if (!folderName) {
        posting = false;
        clearInterval(app);
        await tweet("", "", true);
        await postBsky("", "", true);
        console.log("Killscreen posted. No more images queue. Shutting down.");
        return;
      }

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
        lastExecution = time;
        await deleteImg(imagePath);
        await deleteFolder(imgObj.imgLength, folderName);
      } else {
        console.log(`ABORT: ${imagePath} Failed to Post`);
      }
    }
  } catch (e) {
    console.log("ERROR: Failed during runScript function");
    console.log(`${imgObj ? imgObj.imgName : "undefined"} // ${folderName}`);
    console.log(e);
  } finally {
    posting = false;
  }
}

let timeInterval = admin.debug ? 10000 : 60000;
const app = setInterval(runScript, timeInterval);
console.log("debug mode:", admin.debug);
