import _axios from 'axios';
const process = require('process');
const fs = require('fs');

const axios = _axios.create({
  auth: {
    username: 'maxt2e',
    password: 'Rq6ALoYJzVGXHoN,WTJ',
  },
});

export function parseLink(link: string) {
  // '<https://api.github.com/events?page=2>; rel="next", <https://api.github.com/events?page=10>; rel="last"'
  const [_, url1, tag1, url2, tag2] = link.split(/<(.+?)>;\s*rel="(.+?)",\s*<(.+?)>;\s*rel="(.+?)"/);
  return {
    [tag1]: url1,
    [tag2]: url2,
  };
}

async function fetchUserStarred(username: string) {
  let url = `https://api.github.com/users/${username}/starred`;
  const stars = [];
  while (true) {
    const resp = await axios.get(url);
    stars.push(...resp.data);
    const { next } = parseLink(resp.headers.link || '');
    if (next === url || !next) {
      break;
    }
    console.log(`got ${stars.length} starred repos, continue..`);
    url = next;
  }
  return stars;
}

async function fetchUser(username: string) {
  let url = `https://api.github.com/users/${username}`;
  const user = (await axios.get(url)).data;
  return user;
}

async function main() {
  try {
    const uname = process.argv[2];
    if (!uname) {
      console.error('usage: ts-node get_stars.ts <username>');
    }
    const stars = await fetchUserStarred(uname);
    const user = await fetchUser(uname);
    // 24466870,124171501,zzkkui,mpvue,2018-03-13T01:07:02Z
    console.log(
      stars.map((repo) => [user.id, repo.id, user.login, repo.name, Date()].join(',')).join('\n')
    );
  } catch (error) {
    console.log(error);
  }
}

main();
