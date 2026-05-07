import http from 'https';

http.get('https://site.api.espn.com/apis/v2/sports/soccer/ned.1/standings', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('STATUS ned:', res.statusCode, 'DATA len:', data.length));
}).on('error', err => console.log('ERROR ned:', err.message));

http.get('https://site.api.espn.com/apis/v2/sports/soccer/por.1/standings', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('STATUS por:', res.statusCode, 'DATA len:', data.length));
}).on('error', err => console.log('ERROR por:', err.message));
