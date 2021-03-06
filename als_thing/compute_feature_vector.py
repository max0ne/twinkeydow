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

sc = SparkContext(appName="RR")
sqlContext = SQLContext(sc)

def first_two_column(row):
    return (int(row[0]), int(row[1]))

training_rdd = sqlContext.createDataFrame(train_file).rdd.map(first_two_column)

def train(training_rdd):
    model = ALS.trainImplicit( \
        training_rdd.map(lambda rr: (rr[0], rr[1], 1)),
        rank=16,
        iterations=10,
        lambda_=0.1,
        alpha=80.0
    )
    return model.productFeatures()
def similarity(feature_vecs, columnSimilarities_threshold):
    # transpose `prod_features_rdd`
    def transpose(rm):
        cm = CoordinateMatrix(
            rm.rows.zipWithIndex().flatMap(
                lambda x: [MatrixEntry(x[1], j, v) for j, v in enumerate(x[0])]
            )
        )
        return cm.transpose().toRowMatrix()
    rowmat = RowMatrix(feature_vecs)
    colmat = transpose(rowmat)
    sims = colmat.columnSimilarities(columnSimilarities_threshold)
    return sims
def most_similar(sims):
    sim_entries = sims.entries
    sim_entries_full = sim_entries.flatMap(lambda rr: ((rr.i, (rr.j, rr.value)), (rr.j, (rr.i, rr.value))))
    def foldByKeyCompare(r1, r2):
        if r1 is None:
            return r2
        return r1 if r1[1] > r2[1] else r2
    sim_entries_highest = sim_entries_full.foldByKey(None, foldByKeyCompare)
    return sim_entries_highest
def join_key(keys, most_similars):
    orderedKeys = keys.zipWithIndex().map(lambda rr: (rr[1], rr[0]))
    sim_entries_left_half = most_similars \
        .join(orderedKeys) \
        .map(lambda rr: (rr[1][0][0], (rr[1][1], rr[1][0][1])))
    repo_pairs = sim_entries_left_half.join(orderedKeys).map(lambda rr: (rr[1][0][0], rr[1][1], rr[1][0][1]))
    return repo_pairs
def timer(func, desc):
    import time
    start = time.time()
    result = func()
    end = time.time()
    print(desc, ":", end - start)
    return result
def bind(func, *params):
    def newfunc():
        return func(*params)
    return newfunc

productFeatures = timer(bind(train, training_rdd), "ALS")
productFeatures = productFeatures.cache()
partition_num = productFeatures.count()/PARTITION_SIZE



timeString = datetime.datetime.now().strftime('%X-%m-%d-%Y')

if not os.path.exists(timeString):
    os.makedirs(timeString)

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
