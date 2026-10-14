<<<<<<< HEAD
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
 plugins: [react(), tailwindcss()],
 server: { proxy: { '/api': 'http://localhost:3001' } }
});
=======
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()] })
>>>>>>> 1df728fd4bbb8375232c6ad45e5541837072bcc2
