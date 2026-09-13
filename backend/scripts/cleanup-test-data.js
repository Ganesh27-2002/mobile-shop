const http = require('http');

async function main() {
  const loginData = JSON.stringify({ email: 'admin@mobileshop.com', password: 'Admin@123' });
  
  const token = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data).data.token));
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  const products = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/products?limit=100',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        resolve(parsed.data?.products || parsed.data || []);
      });
    });
    req.on('error', reject);
    req.end();
  });

  for (const prod of products) {
    if (!prod.id.startsWith('d')) {
      console.log(`Deleting product: ${prod.id} (${prod.name})`);
      const delStatus = await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: 5000,
          path: `/api/admin/products/${prod.id}`,
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }, (res) => resolve(res.statusCode));
        req.end();
      });

      if (delStatus !== 200) {
        console.log(`Deactivating non-deletable test product: ${prod.id}`);
        const statusData = JSON.stringify({ isActive: false });
        await new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: `/api/admin/products/${prod.id}/status`,
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(statusData),
              Authorization: `Bearer ${token}`
            }
          }, resolve);
          req.write(statusData);
          req.end();
        });
      }
    }
  }

  console.log('Cleanup finished successfully.');
}

main().catch(console.error);
