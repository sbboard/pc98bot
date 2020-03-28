import GetOldTweets3 as got
import json
import datetime
import random 

#get date information
today = datetime.date.today()
delta = datetime.timedelta(days=60) # ~ 2 months
thatDay = today - delta
start_date = datetime.date(2019, 7, 3)
end_date = thatDay
time_between_dates = end_date - start_date
days_between_dates = time_between_dates.days
random_number_of_days = random.randrange(days_between_dates)
random_date = start_date + datetime.timedelta(days=random_number_of_days)
random_date_yesterday = random_date - datetime.timedelta(days=1)
dateStr = random_date.strftime("%Y-%m-%d")
dateStrYstrdy = random_date_yesterday.strftime("%Y-%m-%d")

#prep json data
data = {}
data['id'] = []

#the twitter search
tweetCriteria = got.manager.TweetCriteria().setQuerySearch('from:pc98_bot #pc98')\
                                           .setSince(dateStrYstrdy)\
                                           .setUntil(dateStr)\
                                           .setMaxTweets(10)
tweet = got.manager.TweetManager.getTweets(tweetCriteria)
for f in range(len(tweet)):
    data['id'].append(tweet[f].id)
with open('retweet.json', 'w') as outfile:
    json.dump(data, outfile)