import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The rules YAML files and i18n dictionaries are read from disk at runtime;
  // make sure they travel with every serverless bundle of the Next runtime.
  outputFileTracingIncludes: {
    '/**': ['./rules/**', './src/i18n/dictionaries/**', './content/legal/**'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  poweredByHeader: false,
  compress: true,
  // Prefer non-www as canonical. www must also be attached in the Vercel domain
  // settings (or DNS) for this host match to run; see README.
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'www.nexusscopes.com' }],
        destination: 'https://nexusscopes.com/',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nexusscopes.com' }],
        destination: 'https://nexusscopes.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
