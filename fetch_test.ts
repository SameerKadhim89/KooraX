import http from 'http';

http.get('http://localhost:3000/api/matches', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA_LEN:', data.length));
}).on('error', err => console.log('ERROR:', err.message));
