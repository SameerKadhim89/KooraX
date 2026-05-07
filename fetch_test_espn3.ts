import http from 'https';

http.get('https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      console.log('Keys:', Object.keys(j));
      if (j.children && j.children[0]) {
         console.log('children[0] keys:', Object.keys(j.children[0]));
         if (j.children[0].standings) {
             console.log('standings len:', j.children[0].standings.details?.length || j.children[0].standings.entries?.length || j.children[0].standings?.length);
         }
      }
    } catch(e) { console.error(e) }
  });
});
