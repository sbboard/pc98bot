const path = require("path");
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
  //url: string;
  media_url: string;
  media_url_https: string;
  id_str: string;
  id: string;
}

archive.forEach((x) => {
  if (!x.tweet?.entities?.hashtags?.some((hashtag) => hashtag.text === "pc98"))
    return;
  console.log(x.tweet?.full_text);
  const folder = x.tweet?.full_text?.replace(
    /^(.*?) \/\/ (.*?) \/\/.*/,
    "$1###$2"
  );
  console.log(folder);
  console.log("-----------");
});
