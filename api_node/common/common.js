const process = require('process');

const envMust = (key, must) => {
  const val = process.env[key];
  if (must && !val) {
    console.error('env key', key, 'missing');
    process.exit('1');
  }
  return val;
};

module.exports = {
  envMust,
};
