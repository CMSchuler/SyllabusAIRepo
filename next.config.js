/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  swcMinify: false,
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js', 'openai', 'pdf-parse', 'mammoth'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        encoding: false,
        bufferutil: false,
        'utf-8-validate': false,
        'pdf-parse': false,
        child_process: false,
      };
    }

    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'encoding': 'commonjs encoding',
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
        'openai': 'commonjs openai',
        '@supabase/supabase-js': 'commonjs @supabase/supabase-js',
      });
    }

    config.ignoreWarnings = [
      { module: /node_modules\/node-fetch\/lib\/index\.js/ },
      { module: /node_modules\/ws\/lib/ },
      { module: /node_modules\/@supabase\/realtime-js/ },
      { module: /node_modules\/openai/ },
    ];

    return config;
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
