var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var TwitterApi = require("twitter-api-v2").TwitterApi;
var BskyAgent = require("@atproto/api").BskyAgent;
var fs = require("fs"), path = require("path"), config = require(path.join(__dirname, "config.js")), bskyConfig = require(path.join(__dirname, "bsky_config.js")), client = new TwitterApi(config), hour = 4, admin = {
    imgDir: "/img/",
    debug: true,
    integrations: {
        twitter: true,
        bsky: true
    }
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
var folders = [];
function getFolder() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(folders.length === 0)) return [3, 2];
                    return [4, readFolders()];
                case 1:
                    folders = _a.sent();
                    _a.label = 2;
                case 2: return [2, new Promise(function (resolve, reject) {
                        var randomFolder = folders[Math.floor(Math.random() * folders.length)];
                        resolve(randomFolder);
                    })];
            }
        });
    });
}
function readFolders() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    fs.readdir(__dirname + admin.imgDir, { withFileTypes: true }, function (err, dirents) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        folders = dirents
                            .filter(function (dirent) { return dirent.isDirectory(); })
                            .map(function (dirent) { return dirent.name; });
                        resolve(folders);
                    });
                })];
        });
    });
}
function getImage(folder) {
    return new Promise(function (resolve, reject) {
        fs.readdir(__dirname + admin.imgDir + folder, function (err, files) {
            if (err) {
                reject(err);
                return;
            }
            var _a = selectRandomImage(files), imgName = _a.imgName, imgLength = _a.imgLength;
            resolve({ imgName: imgName, imgLength: imgLength });
        });
    });
}
function selectRandomImage(files) {
    if (files.length === 0) {
        throw new Error("No images found");
    }
    var randomIndex = Math.floor(Math.random() * files.length);
    var imgName = files[randomIndex];
    var imgLength = files.length;
    return { imgName: imgName, imgLength: imgLength };
}
function createMessage(folder, disableHash) {
    if (disableHash === void 0) { disableHash = true; }
    return __awaiter(this, void 0, void 0, function () {
        var _a, gameName, company, companyHash;
        return __generator(this, function (_b) {
            if (folder == "_unknown") {
                return [2, "unknown // PC-98\nIf you know the name of this software, please leave a reply.\n\u3042\u306A\u305F\u304C\u3053\u306E\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u540D\u524D\u3092\u77E5\u3063\u3066\u3044\u308B\u306A\u3089\u3070\u3001\u7B54\u3048\u3092\u6B8B\u3057\u3066\u304F\u3060\u3055\u3044"];
            }
            else {
                _a = folder.split("###"), gameName = _a[0], company = _a[1];
                if (company) {
                    companyHash = company.replace(/[!@#$'%^()\-&*\[\]\s,.]/g, "");
                    return [2, "".concat(gameName, " // ").concat(company, " // PC-98").concat(disableHash ? "" : " // #pc98 #" + companyHash)];
                }
                else {
                    return [2, "".concat(gameName, " // PC-98").concat(disableHash ? "" : " // #pc98")];
                }
            }
            return [2];
        });
    });
}
function tweet(folder, imagePath) {
    return __awaiter(this, void 0, void 0, function () {
        var msg, mediaId, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4, createMessage(folder, false)];
                case 1:
                    msg = _a.sent();
                    return [4, client.v1.uploadMedia(imagePath)];
                case 2:
                    mediaId = _a.sent();
                    return [4, client.v2.tweet(msg, {
                            media: { media_ids: [mediaId] }
                        })];
                case 3:
                    _a.sent();
                    console.log("Posted ".concat(imagePath, " to Twitter"));
                    return [2, true];
                case 4:
                    e_1 = _a.sent();
                    console.log("ERROR IN TWITTER POSTING");
                    console.log(e_1);
                    return [2, false];
                case 5: return [2];
            }
        });
    });
}
function imageToInt8Array(imagePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    fs.readFile(imagePath, function (err, data) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        var int8Array = new Int8Array(data);
                        resolve(int8Array);
                    });
                })];
        });
    });
}
function postBsky(folder, imagePath) {
    return __awaiter(this, void 0, void 0, function () {
        var agent, int8Array, testUpload, msg, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    agent = new BskyAgent({ service: "https://bsky.social" });
                    return [4, agent.login(bskyConfig)];
                case 1:
                    _a.sent();
                    return [4, imageToInt8Array(imagePath)];
                case 2:
                    int8Array = _a.sent();
                    return [4, agent.uploadBlob(int8Array, {
                            encoding: "image/png"
                        })];
                case 3:
                    testUpload = _a.sent();
                    return [4, createMessage(folder)];
                case 4:
                    msg = _a.sent();
                    return [4, agent.post({
                            text: msg,
                            embed: {
                                images: [
                                    {
                                        image: testUpload.data.blob,
                                        alt: msg
                                    },
                                ],
                                $type: "app.bsky.embed.images"
                            }
                        })];
                case 5:
                    _a.sent();
                    console.log("Posted ".concat(imagePath, " to Bluesky"));
                    return [2, true];
                case 6:
                    e_2 = _a.sent();
                    console.log("ERROR IN BSKY POSTING");
                    console.log(e_2);
                    return [2, false];
                case 7: return [2];
            }
        });
    });
}
function deleteImg(image_path) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, fs.promises.unlink(image_path)];
                case 1:
                    _a.sent();
                    console.log("Deleted image: ".concat(image_path));
                    return [3, 3];
                case 2:
                    err_1 = _a.sent();
                    console.log("ERROR IN IMAGE DELETION");
                    console.log(err_1);
                    return [3, 3];
                case 3: return [2];
            }
        });
    });
}
function deleteFolder(imgLength, folder) {
    return __awaiter(this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!(imgLength - 1 < 1)) return [3, 2];
                    folders = folders.filter(function (f) { return f !== folder; });
                    return [4, fs.promises.rmdir(path.join(__dirname, admin.imgDir, folder))];
                case 1:
                    _a.sent();
                    console.log("Deleted folder: ".concat(folder));
                    _a.label = 2;
                case 2: return [3, 4];
                case 3:
                    err_2 = _a.sent();
                    console.log("ERROR IN FOLDER DELETION");
                    console.log(err_2);
                    return [3, 4];
                case 4: return [2];
            }
        });
    });
}
var posting = false;
var lastExecution = 0;
function runScript() {
    return __awaiter(this, void 0, void 0, function () {
        var imgObj, folderName, time, lastExecutionTime, timeDiff, imagePath, isTweetSuccess, _a, isBskySuccess, _b, e_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (posting)
                        return [2];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 14, 15, 16]);
                    time = Date.now();
                    lastExecutionTime = lastExecution || 0;
                    timeDiff = time - lastExecutionTime;
                    if (!((new Date().getHours() % hour === 0 && new Date().getMinutes() === 0) ||
                        timeDiff >= hour * 60 * 60 * 1000 ||
                        admin.debug)) return [3, 13];
                    posting = true;
                    return [4, getFolder()];
                case 2:
                    folderName = _c.sent();
                    return [4, getImage(folderName)];
                case 3:
                    imgObj = _c.sent();
                    imagePath = path.join(__dirname, admin.imgDir, folderName, imgObj.imgName);
                    if (!twitterSafe(imagePath)) return [3, 5];
                    return [4, tweet(folderName, imagePath)];
                case 4:
                    _a = _c.sent();
                    return [3, 6];
                case 5:
                    _a = false;
                    _c.label = 6;
                case 6:
                    isTweetSuccess = _a;
                    if (!bskySafe(imagePath)) return [3, 8];
                    return [4, postBsky(folderName, imagePath)];
                case 7:
                    _b = _c.sent();
                    return [3, 9];
                case 8:
                    _b = false;
                    _c.label = 9;
                case 9:
                    isBskySuccess = _b;
                    if (!(isTweetSuccess || isBskySuccess)) return [3, 12];
                    lastExecution = time;
                    return [4, deleteImg(imagePath)];
                case 10:
                    _c.sent();
                    return [4, deleteFolder(imgObj.imgLength, folderName)];
                case 11:
                    _c.sent();
                    return [3, 13];
                case 12:
                    console.log("ABORT: ".concat(imagePath, " Failed to Post"));
                    _c.label = 13;
                case 13: return [3, 16];
                case 14:
                    e_3 = _c.sent();
                    console.log("ERROR: Failed during runScript function");
                    console.log("".concat(imgObj ? imgObj.imgName : "undefined", " // ").concat(folderName));
                    console.log(e_3);
                    return [3, 16];
                case 15:
                    posting = false;
                    return [7];
                case 16: return [2];
            }
        });
    });
}
var timeInterval = admin.debug ? 10000 : 60000;
setInterval(runScript, timeInterval);
console.log("debug mode:", admin.debug);
