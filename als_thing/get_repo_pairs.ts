import _axios from 'axios';
import * as fs from 'fs';
import * as process from 'process';

const axios = _axios.create({
  auth: {
    username: 'maxt2e',
    password: 'Rq6ALoYJzVGXHoN,WTJ',
  },
});

async function getRepo(rid: string) {
  const resp1 = await axios.get(`https://api.github.com/repositories/${rid}`);
  return [
    'full_name',
    'html_url',
    'description',
    'language',
  ].map((key) => resp1.data[key]);
}

async function main() {
  const repo_pairs = JSON.parse(fs.readFileSync(process.argv[2]));

  for (const [rid1, rid2] of repo_pairs) {
    try {
      const [full_name1, html_url1, description1, language1] = await getRepo(rid1);
      const [full_name2, html_url2, description2, language2] = await getRepo(rid2);

      console.log(full_name1, language1);
      console.log(description1);
      console.log(html_url1);
      console.log('-----');
      console.log(full_name2, language2);
      console.log(description2);
      console.log(html_url2);

      console.log();
      console.log();
    } catch (error) {
      console.log(error);
    }
    await (new Promise((ful) => setTimeout(ful, 100)));
  }
}

main();
