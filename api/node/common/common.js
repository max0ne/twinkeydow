const process = require('process');
const AWS = require('aws-sdk');

const envMust = (key, must) => {
  const val = process.env[key];
  if (must && !val) {
    console.error('env key', key, 'missing');
    process.exit('1');
  }
  return val;
};

/**
 * load secret object from aws
 * @param {string} name 
 * @return {any} secret JSON object
 */
async function getSecretNamed(name) {
  const endpoint = 'https://secretsmanager.us-east-1.amazonaws.com';
  const region = 'us-east-1';

  // Create a Secrets Manager client
  const client = new AWS.SecretsManager({
    endpoint, region,
  });

  try {
    return JSON.parse((await client.getSecretValue({ SecretId: name }).promise()).SecretString);
  } catch (err) {
    console.error('get secret failed', err);
    return {};
  }
}

const cachedSecretValue = {};

/**
 * @param {string} name 
 * @param {string} key 
 * @param {boolean} must
 * @return {string} secret value
 */
async function secretMust(name, key, must) {

  if (cachedSecretValue[name]) {
    return cachedSecretValue[name][key];
  }
  const secretContent = await getSecretNamed(name);
  cachedSecretValue[name] = secretContent;
  
  const val = secretContent[key];
  if (!val && must) {
    process.exit('get secret faield');
    console.error(name, key, val);
  }
  return val;
}

module.exports = {
  envMust,
  secretMust,
};
