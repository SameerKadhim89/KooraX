import http from 'https';

http.get('https://www.thesportsdb.com/api/v1/json/f874d83052794e869b7dedb5d39ee793/lookuptable.php?l=4328&s=2024-2025', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
}).on('error', err => console.log('ERROR:', err.message));
