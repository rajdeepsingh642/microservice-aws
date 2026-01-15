const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    createProxyMiddleware(['/api/products', '/api/categories', '/api/inventory'], {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    })
  );

  app.use(
    createProxyMiddleware('/api', {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
    })
  );
};
