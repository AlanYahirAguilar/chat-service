const path = require('path')

// URLs de cada microfrontend (env en prod; puertos locales en dev).
const MF = {
  dashboard: process.env.DASHBOARD_URL || 'http://localhost:3001',
  contacts: process.env.CONTACTS_URL || 'http://localhost:3002',
  compose: process.env.COMPOSER_URL || 'http://localhost:3003',
}

const zone = (name) => [
  { source: `/${name}`, destination: `${MF[name]}/${name}` },
  { source: `/${name}/:path*`, destination: `${MF[name]}/${name}/:path*` },
]

/** @type {import('next').NextConfig} */
module.exports = {
  // Build autocontenido para Docker (server.js + node_modules mínimos)
  output: 'standalone',
  transpilePackages: ['@org/ui'],
  outputFileTracingRoot: path.join(__dirname, '../../../'),
  async rewrites() {
    return [
      // API same-origin: el navegador habla con el shell y este proxea al
      // gateway. Así la cookie de sesión (sameSite: strict) funciona en
      // producción sin CORS. API_URL = URL interna/pública del gateway.
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:4001'}/api/:path*`,
      },
      ...zone('dashboard'),
      ...zone('contacts'),
      ...zone('compose'),
    ]
  },
}
