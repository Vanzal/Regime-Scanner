import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The rules YAML files and i18n dictionaries are read from disk at runtime;
  // make sure they travel with every serverless bundle of the Next runtime.
  outputFileTracingIncludes: {
    '/**': ['./rules/**', './src/i18n/dictionaries/**', './content/legal/**'],
  },
}

export default nextConfig
