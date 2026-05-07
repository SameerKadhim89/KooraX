import http from 'http';

http.get('http://localhost:3000/api/highlights', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA len:', data.length, 'START:', data.substring(0, 100)));
}).on('error', err => console.log('ERROR:', err.message));
