import http from 'https';

http.get('https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA len:', data.length));
}).on('error', err => console.log('ERROR:', err.message));
