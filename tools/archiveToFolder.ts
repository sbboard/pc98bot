const path = require("path");
const fs = require("fs");
const archive = require(path.join(__dirname, "archive/tweets.js")) as Tweet[];

interface Tweet {
  tweet?: {
    entities?: {
      media?: Media[];
      hashtags?: { text: string }[];
    };
    id_str?: string;
    id?: string;
    full_text?: string;
    extended_entities?: {
      media?: Media[];
    };
  };
}

interface Media {
  media_url: string;
  media_url_https: string;
  id_str: string;
  id: string;
}

archive.forEach((x) => {
  if (!x.tweet?.entities?.hashtags?.some((hashtag) => hashtag.text === "pc98"))
    return;

  const folder = x.tweet?.full_text?.replace(
    /^(.*?) \/\/ (.*?) \/\/.*/,
    "$1###$2"
  );

  const tweetId = x.tweet?.id_str;
  const mediaUrl = x.tweet?.extended_entities?.media?.[0]?.media_url_https;

  if (!tweetId || !mediaUrl) return;

  const fileName = mediaUrl.split("/").pop();
  const filePath = `archive/tweets_media/${tweetId}-${fileName}`;

  // Sanitize folder name by removing invalid characters
  const targetDir = `archive/posted/${folder}`
    .replaceAll(":", "")
    .replaceAll("?", "")
    .replaceAll("@", "");

  const targetPath = path.join(targetDir, fileName);

  // Ensure the target directory exists
  fs.mkdirSync(targetDir, { recursive: true });

  // Check if the file exists before attempting to move it
  if (fs.existsSync(filePath)) {
    try {
      fs.renameSync(filePath, targetPath);
      // Uncomment this to log the move operation
      console.log(`Moved ${filePath} to ${targetPath}`);
    } catch (error) {
      console.error(`Failed to move ${filePath} to ${targetPath}:`, error);
    }
  } else {
    console.warn(`File does not exist: ${filePath}`);
  }
});
