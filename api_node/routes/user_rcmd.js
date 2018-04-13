const mongodb = require('mongodb');
const common = require('../common/common');
const githubAPI = require('../common/github_api');

const MONGO_URL = common.envMust('MONGO_URL', true);
const MONGO_DB_NAME = common.envMust('MONGO_DB_NAME', true);

/**
 * 
 * @param {*} req 
 * @param {express.res} res 
 * @param {mongodb.MongoClient.db} db
 */
async function handle(req, res, db) {
  // 2. get github token from query
  const { ghToken } = req.query;
  if (!ghToken) {
    return res.status(400).send({ 'msg': 'ghToken required' });
  }

  // 3. get user from github
  const user = await githubAPI.getUser(ghToken);
  if (!user || !user.id) {
    return res.status(400).send({ 'msg': 'invalid github token' });
  }

  // 4. get recommend object from db
  const userRecommend = await db.collection('user_recommend').findOne({
    _id: user.id,
  });
  const defaultUserRecommend = {
    _id: user.id,
  };

  // 5. respond
  res.status(200).json(userRecommend || defaultUserRecommend);

  // 6. insert if not in db
  if (!userRecommend) {
    console.log('inserting new user', user.id);
    await db.collection('user_recommend').insert(defaultUserRecommend);
  } else {
    console.log('user found', user.id);
  }
}

module.exports = async function(req, res) {
  let client;
  try {
    // 1. get db
    client = await mongodb.MongoClient.connect(MONGO_URL);
    const db = client.db(MONGO_DB_NAME);
    await handle(req, res, db);
  } catch (err) {
    console.error('err caught', err);
    res.status(500).send(err);
  }

  client && await client.close();
}
