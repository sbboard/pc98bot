import GetOldTweets3 as got

tweetCriteria = got.manager.TweetCriteria().setQuerySearch('from:pc98_bot #pc98')\
                                           .setSince("2019-09-01")\
                                           .setUntil("2019-09-30")\
                                           .setMaxTweets(1)
tweet = got.manager.TweetManager.getTweets(tweetCriteria)[0]
print(tweet.text)