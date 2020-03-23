var Twit = require('twit')
var path = require('path')
var config = require(path.join(__dirname, 'config.js'));
var T = new Twit(config);

//retweet old post
function checkRetweet(tweetData,num){
    console.log(tweetData)
    if(tweetData[num].retweeted == true){
      checkRetweet(data,num-1)
      console.log("ok")
    }
    else{
      return num
    }
}
  
//retweet old post
function retweet(){
    var params = {
        q: 'from:PC98_bot #pc98',
        result_type: 'mixed',
        count: 100,
    }
    T.get('search/tweets', params, function (err, data) {
        if (!err) {
                let statusNum = data.statuses.length-1
                let goodTweet = checkRetweet(data.statuses,statusNum)
                var retweetId = data.statuses[goodTweet].id_str
                T.post('statuses/retweet/:id', {
                    id: retweetId
                }, function (err, response) {
                    if (response) {
                        console.log('Retweeted!!!');
                    }
                    if (err) {
                            console.log(err);
                        console.log('Problem when retweeting. Possibly already retweeted this tweet!');
                    }
                });
        }
        else {
            console.log('Error during tweet search call');
        }
    });
}

retweet()