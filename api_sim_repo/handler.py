import json
import sys

import numpy as np
from numpy import linalg as LA

prod_feature_norm_name = "prod_feature_norm.npy"
productFeatures_name = "productFeatures.npy"
repo_ids_name = "repo_ids.npy"

def load_feats():
    prod_feature_norm = np.load(prod_feature_norm_name)
    productFeatures = np.load(productFeatures_name)
    repo_ids = np.load(repo_ids_name)

    return prod_feature_norm, productFeatures, repo_ids

def compute_recommend_repo(repo_id, feats, limit):
    prod_feature_norm, productFeatures, repo_ids = feats
    repo_idies = np.where(repo_ids == repo_id)[0]
    
    if np.sum(repo_idies.shape) == 0:
        print('untrained repo id', repo_id)
        return [], []
    repo_idx = repo_idies[0]
    sim_vals = productFeatures.dot(productFeatures[repo_idx]) / (prod_feature_norm * prod_feature_norm[repo_idx])
    sim_vals_idx_sorted = np.argsort(-sim_vals)[:limit]
    return sim_vals[sim_vals_idx_sorted], repo_ids[sim_vals_idx_sorted]

def handle(event, context):
    def response(status, body):
        return {
            "statusCode": status,
            "body": json.dumps(body)
        }

    rid = event['queryStringParameters'].get('rid')
    limit = event['queryStringParameters'].get('limit') or 5
    if rid is None:
        return response(400, "rid required")
    
    rid = int(rid)
    limit = int(limit)

    feats = load_feats()
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
