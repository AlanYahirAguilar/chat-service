const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  // Build autocontenido para Docker (server.js + node_modules mínimos)
  output: 'standalone',
  basePath: '/dashboard',
  transpilePackages: ['@org/ui'],
  outputFileTracingRoot: path.join(__dirname, '../../../'),
}
