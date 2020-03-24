import GetOldTweets3 as got
import json

data = {}
data['id'] = []
tweetCriteria = got.manager.TweetCriteria().setQuerySearch('from:pc98_bot #pc98')\
                                           .setSince("2019-09-01")\
                                           .setUntil("2019-09-30")\
                                           .setMaxTweets(1)
tweet = got.manager.TweetManager.getTweets(tweetCriteria)[0]
data['id'].append(tweet.id)
with open('retweet.json', 'w') as outfile:
    json.dump(data, outfile)

#concept: script is run every time, chooses a random date between today and first post
#checks if it's been retweeted by PC-98 bot before
#returns an id as a json document

#retweet() then reads json document for id and retweets that id