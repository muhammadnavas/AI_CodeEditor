(async () => {
  try {
    const url = 'http://localhost:3001/api/test/start-session';
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('status:', res.status);
    for (const [k, v] of res.headers) {
      console.log(k + ':', v);
    }
    const text = await res.text();
    console.log('\nbody:\n', text);
  } catch (err) {
    console.error('fetch error:', err);
  }
})();
