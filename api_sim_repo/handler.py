import json
import sys
import os

from pymongo import MongoClient
import numpy as np
from numpy import linalg as LA

prod_feature_norm_name = "prod_feature_norm.npy"
productFeatures_name = "productFeatures.npy"
repo_ids_name = "repo_ids.npy"

MONGO_URL = os.environ.get('MONGO_URL')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME')
db = MongoClient(MONGO_URL).get_database(MONGO_DB_NAME)

# env var -> mongo -> (bucketName, bucketKey, shardNumber)
def load_config():
    # {
    #   "body": {
    #     "bucketInfor": {
    #       "bucketName": "cc-spark-product-feature-output",
    #       "key": "02:15:25-04-12-2018 "
    #     },
    #     "shardNumber": 6
    #   },
    #   "config_name": "product_vector_config"
    # }
    try:
        config = db.global_config.find_one({'config_name': 'product_vector_config'}) or {}
        body = config.get('body', {})
        bucketInfo = body.get('bucketInfo', {})
        bucketName = bucketInfo.get('bucketName')
        bucketKey = bucketInfo.get('key')
        shardNumber = int(body.get('shardNumber'))
        return bucketName, bucketKey, shardNumber
    except Exception as err:
        print(err)
        return None, None, None

def load_feats(rid, bucketName, bucketKey, shardNumber):
    try:
        partition_id = str(rid % shardNumber)
        productFeatures_name = 'productFeatures_'+partition_id+".npy"
        prod_feature_norm_name = 'prod_feature_norm_'+partition_id+".npy"
        repo_ids_name = 'repo_ids_'+partition_id+".npy"

        import boto3
        s3 = boto3.resource('s3')
        [s3.Bucket(bucketName).download_file(bucketKey + '/' + fname, fname) for fname in (productFeatures_name, prod_feature_norm_name, repo_ids_name)]

        prod_feature_norm = np.load(prod_feature_norm_name)
        productFeatures = np.load(productFeatures_name)
        repo_ids = np.load(repo_ids_name)

        return prod_feature_norm, productFeatures, repo_ids
    except Exception as err:
        print(err)
        return None

def compute_recommend_repo(repo_id, feats, limit):
    prod_feature_norm, productFeatures, repo_ids = feats
    repo_idies = np.where(repo_ids == repo_id)[0]
    
    if np.sum(repo_idies.shape) == 0:
        print('untrained repo id', repo_id)
        return [], []
    repo_idx = repo_idies[0]
    sim_vals = productFeatures.dot(productFeatures[repo_idx]) / (prod_feature_norm * prod_feature_norm[repo_idx])
    sim_vals_idx_sorted = np.argsort(-sim_vals)[1:limit+1]
    return sim_vals[sim_vals_idx_sorted], repo_ids[sim_vals_idx_sorted]

def handle(event, context):
    def response(status, body):
        return {
            "headers": { "Access-Control-Allow-Origin": "*" },
            "statusCode": status,
            "body": json.dumps(body)
        }
    
    # 0. param
    rid = event['queryStringParameters'].get('rid')
    limit = event['queryStringParameters'].get('limit') or 5
    if rid is None:
        return response(400, "rid required")
    rid = int(rid)
    limit = int(limit)

    # 1. load config from mongo
    bucketName, bucketKey, shardNumber = load_config()
    if bucketName is None or bucketKey is None or shardNumber is None:
        return response(500, "load config failed")

    # 2. download
    feats = load_feats(rid, bucketName, bucketKey, shardNumber)
    if feats is None:
        return response(500, 'unable to load resources')

    sim_vals, sim_rids = compute_recommend_repo(rid, feats, limit)
    return response(200, \
        list(map(lambda rr: { "rid": int(rr[0]), "sim": rr[1] }, zip(sim_rids, sim_vals))) \
        )


def main():
    def eve(queryStringParameters):
        return { 'queryStringParameters': queryStringParameters }
    print(handle(eve({ 'rid': 1 }), None))
    print(handle(eve({ 'rid': u'3605299' }), None))
    print(handle(eve({ 'rid': u'3605299', 'limit': 1 }), None))

if __name__ == '__main__':
    main()
