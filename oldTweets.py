import GetOldTweets3 as got
import json
import datetime
import random 


today = datetime.date.today()
delta = datetime.timedelta(days=60) # ~ 2 months
thatDay = today - delta
start_date = datetime.date(2019, 7, 2)
end_date = thatDay
time_between_dates = end_date - start_date
days_between_dates = time_between_dates.days
random_number_of_days = random.randrange(days_between_dates)
random_date = start_date + datetime.timedelta(days=random_number_of_days)
random_date_yesterday = random_date - datetime.timedelta(days=1)
print(random_date)
print(random_date_yesterday)

dateStr = random_date.strftime("%Y-%m-%d")
dateStrYstrdy = random_date_yesterday.strftime("%Y-%m-%d")

data = {}
data['id'] = []
tweetCriteria = got.manager.TweetCriteria().setQuerySearch('from:pc98_bot #pc98')\
                                           .setSince(dateStrYstrdy)\
                                           .setUntil(dateStr)\
                                           .setMaxTweets(1)
tweet = got.manager.TweetManager.getTweets(tweetCriteria)[0]
data['id'].append(tweet.id)
with open('retweet.json', 'w') as outfile:
    json.dump(data, outfile)

#concept: script is run every time, chooses a random date between today and first post
#checks if it's been retweeted by PC-98 bot before
#returns an id as a json document

#retweet() then reads json document for id and retweets that id