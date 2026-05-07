import http from 'https';

http.get('https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      if (j.children && j.children[0] && j.children[0].standings && j.children[0].standings.entries) {
         console.log('entry 0:', JSON.stringify(j.children[0].standings.entries[0], null, 2));
      }
    } catch(e) { console.error(e) }
  });
});
