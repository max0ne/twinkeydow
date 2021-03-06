import _axios from 'axios';
import * as fs from 'fs';
import * as process from 'process';

const axios = _axios.create({
  auth: {
    username: process.env.GH_USERNAME,
    password: process.env.GH_PASSWORD,
  },
});

async function main() {
  const repo_ids = JSON.parse(fs.readFileSync(process.argv[2]));

  for (const rid of repo_ids) {
    try {
      const resp = await axios.get(`https://api.github.com/repositories/${rid}`);
      const { full_name, html_url, description, language } = resp.data;
      console.log(full_name, language);
      console.log(description);
      console.log(html_url);
      console.log('-----');
      console.log();
      console.log();
    } catch (error) {
      console.log(error);
    }
    await (new Promise((ful) => setTimeout(ful, 100)));
  }
}

main();
