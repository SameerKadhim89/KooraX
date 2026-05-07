import http from 'https';

http.get('https://site.api.espn.com/apis/v2/sports/soccer/uefa.champions/standings', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('STATUS uefa:', res.statusCode, 'DATA len:', data.length));
}).on('error', err => console.log('ERROR uefa:', err.message));
