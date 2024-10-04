import { createServer } from 'http';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getBalance, sendTransaction, getUserBalance, withdrawFromTreasury } from './controllers/productController.js';

const server = createServer((req, res) => {
  if (req.url === '/api/products' && req.method === 'GET') {
    getProducts(req, res);
  } else if (req.url.match(/\/api\/products\/\w+/) && req.method === 'GET') {
    const id = req.url.split('/')[3];
    getProduct(req, res, id);
  } else if (req.url === '/api/products' && req.method === 'POST') {
    createProduct(req, res);
  } else if (req.url.match(/\/api\/products\/\w+/) && req.method === 'PUT') {
    const id = req.url.split('/')[3];
    updateProduct(req, res, id);
  } else if (req.url.match(/\/api\/products\/\w+/) && req.method === 'DELETE') {
    const id = req.url.split('/')[3];
    deleteProduct(req, res, id);
  } else if (req.url === '/api/getBalance' && req.method === 'GET') {
    
    getBalance(req, res);
  }else if (req.url === '/api/getUserBalance' && req.method === 'POST') {
    
    getUserBalance(req, res);
  }else if (req.url === '/api/withdrawFromTreasury' && req.method === 'GET') {
    
    withdrawFromTreasury(req, res);
  }else if (req.url === '/api/sendTransaction' && req.method === 'GET') {
    
    sendTransaction(req, res);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        message: 'Route Not Found: Please use the api/products endpoint',
      })
    );
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default server;
