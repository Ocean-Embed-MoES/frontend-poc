# OceanEmbed landing page

Three focused sections built with Vite, vanilla JavaScript, Three.js, GSAP, and Lenis.

```sh
npm install
npm run dev
npm run build
npm run preview
```

Earth textures are optimized from the supplied local model archive. The landing page does not load the original large GLB. The two CTAs open usable concept previews; the depth geometry and regional temperature profiles are explicitly illustrative, not scientific observations or trained model outputs.

The design includes mobile layouts, keyboard navigation, native accessible dialogs, reduced-motion support, a pause control, offscreen rendering suspension, and static fallbacks when WebGL is unavailable.

Motion implementation follows the official [Lenis GSAP integration](https://github.com/darkroomengineering/lenis#gsap-scrolltrigger) and [GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).
