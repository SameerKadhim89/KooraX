import http from 'http';

http.get('http://localhost:3000/api/highlights', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const h = JSON.parse(data);
      console.log('Got', h.length, 'highlights');
      if (h.length > 0) {
         console.log(h[0]);
         console.log(h[1]);
      }
    } catch(e) { console.error(e) }
  });
}).on('error', err => console.log('ERROR:', err.message));
