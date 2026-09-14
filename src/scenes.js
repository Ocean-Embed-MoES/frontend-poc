import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vUv=uv;
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  vNormal=normalize(normalMatrix*normal);
  vView=normalize(-mv.xyz);
  gl_Position=projectionMatrix*mv;
}`;

class SceneViewport {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);
    this.visible = false;
    this.dirty = true;
    this.observer = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; this.dirty = true; });
    this.observer.observe(canvas);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
    canvas.addEventListener('webglcontextlost', this.onContextLost = (event) => {
      event.preventDefault();
      canvas.parentElement.classList.add('failed');
      this.visible = false;
    });
  }
  resize() {
    const { width, height } = this.canvas.parentElement.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }
  draw() { this.renderer.render(this.scene, this.camera); this.dirty = false; }
  dispose() {
    this.observer.disconnect();
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.scene.traverse((object) => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => {
        Object.values(material.uniforms || {}).forEach(({ value }) => { if (value?.isTexture) value.dispose(); });
        material.dispose();
      });
    });
    this.renderer.dispose();
  }
}

async function createEarth() {
  const canvas = document.querySelector('#earth-canvas');
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  camera.position.set(0, 0, 4.25);
  const view = new SceneViewport(canvas, camera);
  const loader = new THREE.TextureLoader();
  const [day, clouds] = await Promise.all([
    loader.loadAsync('/assets/earth-day.webp'),
    loader.loadAsync('/assets/earth-clouds.webp'),
  ]);
  day.anisotropy = Math.min(4, view.renderer.capabilities.getMaxAnisotropy());
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: { dayMap: { value: day }, cloudMap: { value: clouds } },
    vertexShader,
    fragmentShader: `
      uniform sampler2D dayMap;
      uniform sampler2D cloudMap;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main(){
        vec3 n=normalize(vNormal);
        vec3 light=normalize(vec3(.8,.65,1.0));
        vec3 tex=texture2D(dayMap,vUv).rgb;
        float cloud=texture2D(cloudMap,vUv).r;
        float diffuse=max(dot(n,light),0.0);
        float daylight=smoothstep(-.13,.42,dot(n,light));
        vec3 surface=mix(tex,vec3(.94,.96,1.0),cloud*.84);
        vec3 col=surface*(diffuse*.95+.10)*daylight;
        float fresnel=pow(1.0-max(dot(n,normalize(vView)),0.0),3.8);
        col+=vec3(.22,.48,.82)*fresnel*diffuse*.32;
        gl_FragColor=vec4(col,1.0);
      }
    `,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), earthMaterial);
  globe.rotation.set(.12, -2.67, -.12);
  view.scene.add(globe);

  const orbitGroup = new THREE.Group();
  orbitGroup.rotation.set(.85, .05, -.35);
  const orbitPoints = [];
  for (let i = 0; i <= 160; i++) {
    const a = i / 160 * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(Math.cos(a) * 1.38, Math.sin(a) * 1.38, 0));
  }
  const orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPoints), new THREE.LineBasicMaterial({ color: 0x777777, transparent: true, opacity: .24 }));
  orbitGroup.add(orbit);
  const satellite = new THREE.Group();
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xdddddd });
  satellite.add(new THREE.Mesh(new THREE.BoxGeometry(.034,.04,.03), bodyMaterial));
  const solarMaterial = new THREE.MeshBasicMaterial({ color: 0x55555b });
  [-1,1].forEach((side)=>{
    const panel = new THREE.Mesh(new THREE.BoxGeometry(.055,.035,.003), solarMaterial);
    panel.position.x=side*.05;
    satellite.add(panel);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(panel.geometry), new THREE.LineBasicMaterial({ color: 0xbbbbbb }));
    edges.position.copy(panel.position);
    satellite.add(edges);
  });
  orbitGroup.add(satellite);
  view.scene.add(orbitGroup);
  let elapsed = 0;
  const state = { rotation: 0, tilt: 0, scale: 1 };
  let drag = null;
  const onDown = (event) => {
    if(event.button!==0)return;
    drag={x:event.clientX,y:event.clientY,rotation:state.rotation,tilt:state.tilt};
    canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event) => {
    if(!drag)return;
    state.rotation=drag.rotation+(event.clientX-drag.x)*.006;
    state.tilt=THREE.MathUtils.clamp(drag.tilt+(event.clientY-drag.y)*.004,-.65,.65);
    view.dirty=true;
  };
  const onUp = (event) => {
    drag=null;
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  };
  const reset = () => { elapsed=0;state.rotation=0;state.tilt=0;view.dirty=true; };
  const rotate = () => { state.rotation+=Math.PI/6;view.dirty=true; };
  const onKey = (event) => {
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home')reset();
    else if(event.key==='ArrowLeft')state.rotation-=.15;
    else if(event.key==='ArrowRight')state.rotation+=.15;
    else state.tilt=THREE.MathUtils.clamp(state.tilt+(event.key==='ArrowUp'?-.1:.1),-.65,.65);
    view.dirty=true;
  };
  canvas.addEventListener('pointerdown',onDown);
  canvas.addEventListener('pointermove',onMove);
  canvas.addEventListener('pointerup',onUp);
  canvas.addEventListener('pointercancel',onUp);
  canvas.addEventListener('keydown',onKey);
  function update(delta, paused) {
    if (!view.visible) return;
    if (!paused && !drag) elapsed += delta;
    if ((!paused && !drag) || view.dirty) {
      globe.rotation.y = -2.67 + elapsed * .025 + state.rotation;
      globe.rotation.x = .12 + state.tilt;
      globe.scale.setScalar(state.scale);
      const a = elapsed * .09 + .45;
      satellite.position.set(Math.cos(a)*1.38,Math.sin(a)*1.38,0);
      satellite.rotation.z = a;
      view.draw();
    }
  }
  view.draw();
  canvas.parentElement.classList.add('ready');
  return { update, state, reset, rotate, dirty:()=>{view.dirty=true;}, dispose:()=>{
    canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);
    canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);canvas.removeEventListener('keydown',onKey);
    view.dispose();
  } };
}

function createDepth() {
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.set(3.6,2.5,4.1);
  camera.lookAt(0,-.3,0);
  const view = new SceneViewport(document.querySelector('#depth-canvas'),camera);
  const group = new THREE.Group();
  group.rotation.y = -.18;
  view.scene.add(group);
  const layers=[];
  const layerCount=15;
  const grid=35;
  function wave(x,z,layer) {
    return (Math.sin(x*2.4+z*.8)*.06+Math.cos(z*3.2-x)*.045+Math.sin(x*4.1-z*2)*.025)*(1-layer*.04);
  }
  for(let level=0;level<layerCount;level++) {
    const points=[];
    const y=.72-level*.105;
    for(let row=0;row<=grid;row++){
      const z=-1.25+row/grid*2.5;
      for(let col=0;col<grid;col++) {
        const x=-1.35+col/grid*2.7;
        const next=-1.35+(col+1)/grid*2.7;
        points.push(x,y+wave(x,z,level),z,next,y+wave(next,z,level),z);
      }
    }
    // Sparse cross-lines keep the volume legible without visual noise.
    for(let col=0;col<=grid;col+=5){
      const x=-1.35+col/grid*2.7;
      for(let row=0;row<grid;row++){
        const z=-1.25+row/grid*2.5;
        const next=-1.25+(row+1)/grid*2.5;
        points.push(x,y+wave(x,z,level),z,x,y+wave(x,next,level),next);
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    const material=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:level===7?.85:.065,depthWrite:false});
    const mesh=new THREE.LineSegments(geometry,material);
    group.add(mesh);
    layers.push(mesh);
  }
  let elapsed=0;
  const state={angle:0,selected:7};
  return {
    state,
    select(index){
      state.selected=index;
      layers.forEach((layer,i)=>{
        layer.material.opacity=i===index?.88:i===0?.22:Math.max(.055,.12-i*.004);
      });
      view.dirty=true;
    },
    update(delta,paused){
      if(!view.visible)return;
      if(!paused)elapsed+=delta;
      if(!paused||view.dirty){
        group.rotation.y=-.18+Math.sin(elapsed*.15)*.075+state.angle;
        view.draw();
      }
    },
    dispose:()=>view.dispose(),
  };
}

export async function createScenes() {
  let earth=null,depth=null;
  try { earth=await createEarth(); }
  catch(error){ document.querySelector('.hero-art').classList.add('failed'); console.warn('Earth rendering unavailable; showing the static view.',error); }
  try { depth=createDepth();depth.select(7); }
  catch(error){ document.querySelector('.depth-art').classList.add('failed'); console.warn('Depth rendering unavailable; showing the static study.',error); }
  return {earth,depth};
}
