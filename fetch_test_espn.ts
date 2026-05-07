import http from 'https';

http.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/standings', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
}).on('error', err => console.log('ERROR:', err.message));
