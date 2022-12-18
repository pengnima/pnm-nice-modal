import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = mode === 'development'
  console.log({ isDev })

  return {
    build: {
      assetsDir: '',
      rollupOptions: {
        external: ['vue', 'element-plus'],
        output: {
          globals: {
            vue: 'Vue',
            'element-plus': 'ElementPlus',
          },
        },
      },
      minify: isDev ? false : 'esbuild',
      lib: {
        entry: './index.ts',
        formats: ['es', 'umd'],
        name: 'PnmModal',
        fileName: (format) => `index.${format}.js`,
      },
    },
    plugins: [vue()],
  }
})
