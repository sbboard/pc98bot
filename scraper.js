const fs = require("fs"),
  path = require("path"),
  config = require(path.join(__dirname, "scrape_config.js")),
  puppeteer = require("puppeteer"),
  //   archive = require("./archive/tweet.js"),
  hour = 4, //4 for normal, 1 for hourly
  //   retweetEvery = 5, //0 for every time, 5 for normal
  admin = {
    imgDir: "/img/",
    debug: true,
  };

let browser;
// let counter = 1;

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
    postTweet(b64content, msg);
  });
}

async function postTweet(img, msg) {
  const page = await browser.newPage();
  await page.goto("https://mobile.twitter.com/");
  const loginCheck = await page.evaluateHandle(() => {
    return document.querySelector("[data-testid='login']");
  });

  console.log(loginCheck);

  if (loginCheck) {
    await loginCheck.click();
    await loginCheck.dispose();
    await page.waitForSelector("[data-testid='google_sign_in_container']");
    const usernameInput = await page.evaluateHandle(() => {
      return document
        .querySelector("[data-testid='google_sign_in_container']")
        .parentElement.querySelector("input");
    });
    await usernameInput.focus();
    await page.keyboard.type(config.username);
    // await page.evaluate((config) => {
    //   document.querySelector("input").value = "PEEN";
    //   //   Array.from(document.querySelectorAll("[role='button']"))
    //   //     .filter((v) => v.textContent === "Next")[0]
    //   //     .click();
    // }, config);
  }
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

// async function postRT(RTID) {
//   const browser = await puppeteer.launch();
//   await browser.close();
// }

// async function retweet() {
//   const archiveLength = archive.length;
//   const rand = Math.floor(Math.random() * archiveLength);
//   if (archive[rand].tweet.entities.hashtags.some((i) => i.text === "pc98")) {
//     postRT(archive[rand].tweet.id);
//   } else retweet();
// }

async function runScript() {
  const time = new Date();
  browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  if ((time.getHours() % hour == 0 && time.getMinutes() == 0) || admin.debug) {
    getCount().then(async function (numOfGames) {
      if (
        numOfGames > 0 //&& counter < retweetEvery
      ) {
        const folderName = await getFolder();
        const imgObj = await getImage(folderName);
        const filepath = await tweet(folderName, imgObj.imgName);
        await deleteImg(filepath);
        await deleteFolder(imgObj.imgLength, folderName);
        // counter++;
        //   } else {
        //     retweet();
        //     counter = 1;
      }
    });
  }
}

let timeInterval = admin.debug ? 5000 : 60000;
//setInterval(runScript, timeInterval);
runScript();
console.log("admin mode:", admin.debug);
