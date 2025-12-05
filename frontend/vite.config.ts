import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Map mode to app entry point
  const appEntries: Record<string, string> = {
    admin: 'src/apps/admin/main.tsx',
    operator: 'src/apps/operator/main.tsx',
    audience: 'src/apps/audience/main.tsx',
    jury: 'src/apps/jury/main.tsx',
  };

  // Default to admin if mode is development
  const entry = appEntries[mode] || appEntries.admin;
  const appName = Object.keys(appEntries).includes(mode) ? mode : 'admin';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },
    server: {
      // Each app runs on its own port
      port: mode === 'operator' ? 5101 
           : mode === 'audience' ? 5102 
           : mode === 'jury' ? 5103 
           : 5101,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      outDir: `dist/${appName}`,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      },
    },
    define: {
      __APP_NAME__: JSON.stringify(appName),
    },
  };
});

