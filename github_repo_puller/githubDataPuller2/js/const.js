const QUEUE_NAME = "myQueue"
const REDIS_HOST_IP= "127.0.0.1"
const REDIST_HOST_PORT = 6379
const NS = "rsmq"
const WORKER_TASK_NUM = 10
const API_ENDPOINT = "https://api.github.com"
const KEY_PREFIX = "github:user-star"
const DB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'githubDB';
const COLLECTION_NAME = 'githubUserStarredRepo_v2'

module.exports = {
    QUEUE_NAME: QUEUE_NAME,
    REDIS_HOST_IP:REDIS_HOST_IP,
    REDIST_HOST_PORT:REDIST_HOST_PORT,
    NS:NS,
    WORKER_TASK_NUM:WORKER_TASK_NUM,
    api_token:null,
    API_ENDPOINT:API_ENDPOINT,
    KEY_PREFIX:KEY_PREFIX,
    DB_URL:DB_URL,
    DB_NAME:DB_NAME,
    COLLECTION_NAME:COLLECTION_NAME,
};
