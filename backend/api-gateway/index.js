const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
});

// Proxy routes to microservices
app.use('/api/users', createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:4001',
    changeOrigin: true,
    pathRewrite: { '^/api/users': '' }
}));

app.use('/api/resume', createProxyMiddleware({
    target: process.env.RESUME_SERVICE_URL || 'http://localhost:4002',
    changeOrigin: true,
    pathRewrite: { '^/api/resume': '' }
}));

app.use('/api/interview', createProxyMiddleware({
    target: process.env.INTERVIEW_SERVICE_URL || 'http://localhost:4003',
    changeOrigin: true,
    pathRewrite: { '^/api/interview': '' }
}));

// WebSocket Proxy for Interview Service - Using pathFilter to avoid stripping /socket.io
const wsProxy = createProxyMiddleware({
    target: process.env.INTERVIEW_SERVICE_URL || 'http://localhost:4003',
    changeOrigin: true,
    ws: true,
    pathFilter: '/socket.io',
    logLevel: 'debug',
    onProxyReqWs: (proxyReq, req, socket, options, head) => {
        console.log(`[WS Proxy] Request: ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        if (req.url.includes('socket.io')) {
            console.log(`[Socket Proxy] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
        }
    }
});

app.use(wsProxy);

const server = app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});

// Explicitly handle upgrade event for WebSockets
server.on('upgrade', wsProxy.upgrade);
