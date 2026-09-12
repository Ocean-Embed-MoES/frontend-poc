import {defineConfig} from 'vite';

export default defineConfig({
  server:{host:'0.0.0.0'},
  build:{rollupOptions:{output:{manualChunks(id){
    if(id.includes('/three/'))return 'three';
    if(/\/(gsap|lenis)\//.test(id))return 'animation';
  }}}},
});
