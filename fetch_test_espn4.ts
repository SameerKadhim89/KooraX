import http from 'https';

http.get('https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      const standingsObj = j.children[0].standings;
      console.log('standings obj keys:', Object.keys(standingsObj));
      console.log('Is Array?', Array.isArray(standingsObj));
      if (!Array.isArray(standingsObj)) {
        console.log('entries keys:', Object.keys(standingsObj.entries || {}));
      }
    } catch(e) { console.error(e) }
  });
});
