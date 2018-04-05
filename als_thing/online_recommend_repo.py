import numpy as np
from numpy import linalg as LA

np_features = np.load('productFeatures.npy')
np_la_norm = np.load('prod_feature_norm.npy')

def similar(repoid):
    

def handle(event, context):
    np_features = np.load('productFeatures.npy')
    np_la_norm = np.load('prod_feature_norm.npy')

    print(np_features.shape)

    def compute_recommend_repo(repo_idx):
        return np.argsort(np_features.dot(np_features[repo_idx]) / (np_la_norm * np_la_norm[repo_idx]))

    return compute_recommend_repo(2)[:5]

if __name__ == '__main__':
    handle(None, None)
