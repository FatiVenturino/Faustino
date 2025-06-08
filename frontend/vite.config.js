import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 5173
    },
    define: {
        'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3000/api')
    }
}); 