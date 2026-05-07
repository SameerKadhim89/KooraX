import http from 'http';

http.get('http://localhost:3000/api/highlights?league=' + encodeURIComponent('الدوري الهولندي'), (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const h = JSON.parse(data);
      console.log('Got', h.length, 'highlights for Dutch league');
      if (h.length > 0) {
         console.log(h[0].title, h[0].channel);
      }
    } catch(e) { console.error(e) }
  });
}).on('error', err => console.log('ERROR:', err.message));
