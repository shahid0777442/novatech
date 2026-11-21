'use strict';

const http = require('node:http');
const { createApp } = require('./app');

const port = Number(process.env.PORT) || 3000;
const server = http.createServer(createApp());

server.listen(port, () => {
  console.log(`NovaTech site listening on http://localhost:${port}`); // lint-allow
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`); // lint-allow
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
