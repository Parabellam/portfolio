// Escena WebGL (Three.js): cubo de alambre con aristas brillantes y una masa de lava
// que se deforma con un shader. Se carga solo si el navegador tiene WebGL 2.
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import type { Texture } from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { ForgeRenderer } from './types';

// Ruido simplex 3D (Ashima Arts / Stefan Gustavson, licencia MIT).
const NOISE = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

const VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vHeat;
  ${NOISE}
  // Deformación grande y lenta (la masa "respira") más un detalle fino.
  float field(vec3 p){
    float big = snoise(p * 0.62 + vec3(uTime * 0.21, uTime * 0.15, -uTime * 0.18));
    float fine = snoise(p * 1.3 - vec3(uTime * 0.27));
    return big * 0.36 + fine * 0.05;
  }
  vec3 displace(vec3 p){ return p + normalize(p) * field(p); }
  void main(){
    vec3 p = displace(position);
    // Normal recalculada sobre la superficie deformada (dos vecinos en el plano tangente).
    vec3 n = normalize(normal);
    vec3 t = normalize(abs(n.y) < 0.99 ? cross(n, vec3(0.0, 1.0, 0.0)) : cross(n, vec3(1.0, 0.0, 0.0)));
    vec3 b = cross(n, t);
    float e = 0.02;
    vec3 pt = displace(position + t * e);
    vec3 pb = displace(position + b * e);
    vec3 dn = normalize(cross(pt - p, pb - p));
    vHeat = field(position);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * dn);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uMid;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vHeat;
  void main(){
    // De frente: rojo profundo. Hacia el borde: naranja y amarillo.
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float rim = 1.0 - facing;
    vec3 col = mix(uCore, uMid, smoothstep(0.0, 0.42, rim + vHeat * 0.2));
    col = mix(col, uRim, smoothstep(0.32, 0.85, rim));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function glowSprite(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,240,210,1)');
  grad.addColorStop(0.25, 'rgba(255,170,90,0.8)');
  grad.addColorStop(1, 'rgba(255,90,31,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export function createWebGLRenderer(host: HTMLElement): ForgeRenderer {
  // Si el navegador no puede crear el contexto, esto lanza y se usa el respaldo 2D.
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 7.3);

  const group = new Group();
  scene.add(group);

  // Masa de lava.
  const uniforms = {
    uTime: { value: 0 },
    uCore: { value: new Color('#e0301a') },
    uMid: { value: new Color('#ff7a1a') },
    uRim: { value: new Color('#ffdc4a') },
  };
  group.add(
    new Mesh(
      new IcosahedronGeometry(1.1, 48),
      new ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT }),
    ),
  );

  // Cubo de alambre: línea fina + dos halos aditivos que simulan el brillo.
  const edges = new LineSegmentsGeometry().fromEdgesGeometry(new EdgesGeometry(new BoxGeometry(2.5, 2.5, 2.5)));
  const lineLayers = [
    { color: '#ffd0a0', width: 1.6, opacity: 1, additive: false },
    { color: '#ff7a2a', width: 7, opacity: 0.22, additive: true },
    { color: '#ff5a1f', width: 18, opacity: 0.07, additive: true },
  ].map(({ color, width, opacity, additive }) => {
    const mat = new LineMaterial({
      color: new Color(color).getHex(),
      linewidth: width,
      transparent: opacity < 1,
      opacity,
      depthWrite: !additive,
      blending: additive ? AdditiveBlending : NormalBlending,
    });
    group.add(new LineSegments2(edges, mat));
    return mat;
  });

  // Puntos de luz en las esquinas.
  const corners = new BufferGeometry();
  const h = 1.25;
  const pts: number[] = [];
  for (const x of [-h, h]) for (const y of [-h, h]) for (const z of [-h, h]) pts.push(x, y, z);
  corners.setAttribute('position', new Float32BufferAttribute(pts, 3));
  group.add(
    new Points(
      corners,
      new PointsMaterial({
        size: 0.34,
        map: glowSprite(),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    ),
  );

  return {
    kind: 'webgl',
    resize(size) {
      renderer.setSize(size, size, false);
      camera.updateProjectionMatrix();
      const px = size * renderer.getPixelRatio();
      lineLayers.forEach((m) => m.resolution.set(px, px));
    },
    render(rx, ry, time) {
      uniforms.uTime.value = time;
      group.rotation.set(rx, ry, 0.1);
      renderer.render(scene, camera);
    },
  };
}
