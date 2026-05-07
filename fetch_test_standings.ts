import http from 'http';

http.get('http://localhost:3000/api/standings?league=' + encodeURIComponent('الدوري الإنجليزي'), (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
}).on('error', err => console.log('ERROR:', err.message));
