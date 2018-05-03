import boto3
import pandas as pd
import os
import findspark
from pyspark import SparkContext
from pyspark.sql import SQLContext
from pyspark.sql.functions import reverse
from pyspark.mllib.recommendation import ALS
from pyspark.mllib.linalg.distributed import CoordinateMatrix, MatrixEntry, RowMatrix
import numpy as np
from numpy import linalg as LA
import datetime
import json

secret_name = "mongodb_credential"
endpoint_url = "https://secretsmanager.us-east-1.amazonaws.com"
region_name = "us-east-1"

session = boto3.session.Session()
client = session.client(
    service_name='secretsmanager',
    region_name=region_name,
    endpoint_url=endpoint_url
)

get_secret_value_response = client.get_secret_value(
    SecretId=secret_name
)

secret = get_secret_value_response['SecretString']
config_json = json.loads(secret)

MONGO_URL = config_json["MONGO_URL"]
MONGO_DB_NAME = config_json["MONGO_DB_NAME"]
client = MongoClient(MONGO_URL)
db = client[MONGO_DB_NAME]
collection = db['global_config']
config = collection.find_one({"config_name":"product_vector_config"})

# PARTITION_SIZE = config["body"]["shard_size"]
# SPARK_HOME = "/usr/lib/spark"
OUTPUT_BUCKET_NAME = config["body"]["bucketInfo"]["bucketName"]

INPUT_BUCKET_NAME = config["body"]["bucketInfo"]["inputBucketName"]
KEY = '16kUser.csv'
s3 = boto3.resource('s3')
s3.Bucket(INPUT_BUCKET_NAME).download_file(KEY, '16kUser.csv')

train_file = pd.read_csv('16kUser.csv', index_col=None, sep=',',header=None)
train_file.columns = ['uid', 'repoid']
train_file = train_file.drop_duplicates()
train_file.dropna(inplace=True)
train_file.repoid = train_file.repoid.astype(int)
# train_file.head()

os.environ["SPARK_HOME"] = SPARK_HOME
# findspark.init("/usr/lib/spark")

# train_file.columns = ['uid', 'repoid', 'uname', 'reponame', 'date']
train_file.columns = ['uid', 'repoid']
train_file = train_file.drop_duplicates()
train_file.dropna(inplace=True)
train_file.repoid = train_file.repoid.astype(int)
#train_file.head()

#-------------------------------------------------
#user rdd create

get_secret_value_response = client.get_secret_value(
    SecretId=secret_name
)

secret = get_secret_value_response['SecretString']
config_json = json.loads(secret)

MONGO_URL = config_json["MONGO_URL"]
MONGO_DB_NAME = config_json["MONGO_DB_NAME"]
client = MongoClient(MONGO_URL)
db = client[MONGO_DB_NAME]
collection = db['global_config']
config = collection.find_one({"config_name":"register_user"})

# PARTITION_SIZE = config["body"]["shard_size"]
# SPARK_HOME = "/usr/lib/spark"
OUTPUT_BUCKET_NAME = config["body"]["bucketInfo"]["bucketName"]

INPUT_BUCKET_NAME = config["body"]["bucketInfo"]["inputBucketName"]
KEY = 'registerd_user_star_repo.csv'
s3 = boto3.resource('s3')
s3.Bucket(INPUT_BUCKET_NAME).download_file(KEY, 'registerd_user_star_repo.csv')


user_file = pd.read_csv('registerd_user_star_repo.csv', index_col=None, sep=',',header=None)
user_file.columns = ['uid', 'repoid']
user_file = train_file.drop_duplicates()
user_file.dropna(inplace=True)
user_file.repoid = train_file.repoid.astype(int)


#the users that have alreday register out web app.

# user_file.columns = ['uid', 'repoid', 'uname', 'reponame', 'date']
user_file.columns = ['uid', 'repoid']
user_file = user_file.drop_duplicates()
user_file.dropna(inplace=True)
user_file.repoid = train_file.repoid.astype(int)
#user_file.head()



#------------
train_file = train_file[['uid', 'repoid']]
#train_file.head()
user_file = user_file[['uid', 'repoid']]


# import findspark
# findspark.init("/usr/local/spark-2.3.0")

from pyspark import SparkContext
from pyspark.sql import SQLContext

from pyspark.mllib.recommendation import ALS

sc = SparkContext(appName="RR")
sqlContext = SQLContext(sc)

def first_two_column(row):
    return (int(row[0]), int(row[1]), 1.0)

training_rdd = sqlContext.createDataFrame(train_file).rdd
training_rdd = training_rdd \
    .map(first_two_column)


user_rdd = sqlContext.createDataFrame(user_file).rdd
#user_rdd.take(5)

# this takes a short while too
model = ALS.trainImplicit( \
    training_rdd,
    rank=16,
    iterations=10,
    lambda_=0.1,
    alpha=80.0
)

# append user to training set and train again
training_rdd = training_rdd.union(user_rdd.map(first_two_column))
# this takes a short while too
model = ALS.trainImplicit( \
    training_rdd,
    rank=16,
    iterations=10,
    lambda_=0.1,
    alpha=80.0
)

user_id_file = user_file[['uid']].drop_duplicates()
#user_id_file.head()
user_id_rdd = sqlContext.createDataFrame(user_id_file).rdd
#user_id_rdd.take(10)



#--------------------------------------------
#output to mongo database
from pymongo import MongoClient
#mongodb://super:tKoJDjMtgcFPD_2Pfet@ds247587.mlab.com:47587/twinkeydow

try:
    conn = MongoClient("mongodb://super:tKoJDjMtgcFPD_2Pfet@ds247587.mlab.com:47587/twinkeydow")
    print("Connected successfully!!!")
except:
    print("Could not connect to MongoDB")

db = conn['twinkeydow']

# Created or Switched to collection names: my_gfg_collection
collection = db['userbaserec']


recomend_num = 5
num = user_id_rdd.count()
for i in range(num):
    #print(user_id_rdd.take(num)[i].uid)
    uid = user_id_rdd.take(num)[i].uid
    user_products = model.recommendProducts(uid, recomend_num)
    rec_id = []
    for obj in user_products:
        rec_id.append(obj.product)

    record = {
        "_id": uid,
        "rids": rec_id,
    }
    rec = collection.update_one({"_id": uid}, {"$set":record}, upsert=True)
