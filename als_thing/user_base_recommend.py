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
from pymongo import MongoClient
import json

# config_file = open("/home/ec2-user/.config","r")
# config_json = json.loads(config_file.read())

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

PARTITION_SIZE = config["body"]["shard_size"]
SPARK_HOME = "/usr/lib/spark"
OUTPUT_BUCKET_NAME = "cc-spark-product-feature-output"
INPUT_BUCKET_NAME = 'cc-spark-test-data'
KEY = '16kUser.csv'
s3 = boto3.resource('s3')
s3.Bucket(INPUT_BUCKET_NAME).download_file(KEY, '16kUser.csv')

train_file = pd.read_csv('16kUser.csv', index_col=None, sep=',',header=None)
train_file.columns = ['uid', 'repoid', 'uname', 'reponame', 'date']
train_file = train_file.drop_duplicates()
train_file.head()

# train_file.dropna(inplace=True)
# train_file.repoid = train_file.repoid.astype(int)
# train_file.head()

os.environ["SPARK_HOME"] = SPARK_HOME
# findspark.init("/usr/lib/spark")

user_file = pd.read_csv('16kUser.csv', index_col=None, sep=',') \
    .drop_duplicates()
user_file.columns = ['uid', 'repoid', 'uname', 'reponame', 'date']
user_file = user_file.drop_duplicates()
user_file.head()



# take only uid / repoid
train_file = train_file[['uid', 'repoid']]
train_file.head()

# same thing for user file
user_file = user_file[['uid', 'repoid']]
user_file.head()


sc = SparkContext(appName="RR")
sqlContext = SQLContext(sc)


def first_two_column(row):
    return (int(row[0]), int(row[1]), 1.0)

# training_rdd = sqlContext.createDataFrame(train_file).rdd.map(first_two_column)

training_rdd = sqlContext.createDataFrame(train_file).rdd
training_rdd = training_rdd \
    .map(first_two_column)

training_rdd.take(5)


model = ALS.trainImplicit( \
    training_rdd,
    rank=16,
    iterations=10,
    lambda_=0.1,
    alpha=80.0
)


user_rdd = sqlContext.createDataFrame(user_file).rdd
user_rdd.take(5)

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

predictions = model.predictAll(predict_input_rdd).sortBy(lambda row: -row.rating)

# remove repos user already starred
# this is top 10 recommendations for user
res = predictions.map(lambda row: (row.product, row)) \
    .subtractByKey(user_rdd.map(lambda row: (row[1], 0))) \
    .map(lambda row: row[0]) \
    .take(10)


#output
for x in range(0, partition_num):
    def filter(row):
        return (row[0] % partition_num == x)
    productFeatureShard = productFeatures.filter(filter)
    np_features_shard = np.array(productFeatureShard.values().collect())
    np_keys_shard = np.array(productFeatureShard.keys().collect())
    np_la_norm_shard = np.array(list(map(LA.norm, np_features_shard)))
    str_x = str(x)
    productFeaturesFileName = 'productFeatures_'+str_x+".npy"
    prod_feature_norm_FileName = 'prod_feature_norm_'+str_x+".npy"
    repo_ids_FileName = 'repo_ids_'+str_x+".npy"
    np.save(timeString+"/"+productFeaturesFileName, np_features_shard)
    np.save(timeString+"/"+prod_feature_norm_FileName, list(np_la_norm_shard))
    np.save(timeString+"/"+repo_ids_FileName, np_keys_shard)
    s3.Bucket(OUTPUT_BUCKET_NAME).upload_file(timeString+"/"+productFeaturesFileName,timeString+"/"+productFeaturesFileName)
    s3.Bucket(OUTPUT_BUCKET_NAME).upload_file(timeString+"/"+prod_feature_norm_FileName,timeString+"/"+prod_feature_norm_FileName)
    s3.Bucket(OUTPUT_BUCKET_NAME).upload_file(timeString+"/"+repo_ids_FileName,timeString+"/"+repo_ids_FileName)

config["body"]["shardNumber"] = partition_num
config["body"]["bucketInfo"]["key"] = timeString
collection.update({"config_name":"product_vector_config"},config,upsert=True)
