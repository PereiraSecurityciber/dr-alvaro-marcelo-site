import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const smooth = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/* Molar estilizado: esfera deformada em coroa com cúspides e duas raízes */
function buildToothGeometry() {
  let geo = new THREE.SphereGeometry(1, 180, 180);
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let { x, y, z } = v;
    const r = Math.hypot(x, z);
    const theta = Math.atan2(z, x);

    // contorno levemente quadrado da coroa
    const box = 1 + 0.07 * Math.cos(4 * theta);
    x *= box * 1.02;
    z *= box * 0.9;

    if (y > 0) {
      // face oclusal achatada, quatro cúspides e sulco central
      const top = smooth(0.05, 0.55, y);
      const cusps = 0.17 * (0.5 + 0.5 * Math.cos(4 * theta - Math.PI)) * Math.sin(Math.PI * Math.min(r * 1.25, 1));
      const groove = 0.13 * Math.exp(-((r / 0.28) ** 2));
      y = y * 0.6 + top * (cusps - groove);
    } else {
      // raízes: alongamento, afunilamento e furca entre as duas raízes
      const t = -y;
      const taper = 1 - 0.42 * smooth(0.15, 1, t);
      const split = smooth(0.3, 1, t);
      const ax = Math.abs(x);
      x = x * taper * (1 - 0.25 * split) + Math.sign(x) * 0.2 * split;
      z *= taper * (1 - 0.18 * split);
      y = -(t * 0.55 + t ** 2.2 * 1.45);
      y += split * (1 - smooth(0.0, 0.5, ax)) * 1.25;
      // leve curvatura distal das raízes
      x += Math.sign(x) * 0.06 * t ** 3;
    }
    pos.setXYZ(i, x, y + 0.55, z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function initTooth(canvas, { reduceMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    canvas.remove();
    return;
  }
  const isSmall = window.matchMedia('(max-width: 960px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.1, 7.4);

  const group = new THREE.Group();
  scene.add(group);

  const tooth = new THREE.Mesh(
    buildToothGeometry(),
    new THREE.MeshPhysicalMaterial({
      color: 0xd9d9d9,
      metalness: 1,
      roughness: 0.17,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.15,
    }),
  );
  tooth.rotation.set(0.18, -0.5, 0.12);
  group.add(tooth);

  // anel prateado e partículas discretas
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.006, 8, 220),
    new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 1, roughness: 0.25 }),
  );
  ring.rotation.set(Math.PI / 2.35, 0.25, 0);
  group.add(ring);

  const count = isSmall ? 70 : 140;
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const rad = 1.6 + Math.random() * 1.1;
    pts[i * 3] = Math.cos(a) * rad;
    pts[i * 3 + 1] = (Math.random() - 0.5) * 2.8;
    pts[i * 3 + 2] = Math.sin(a) * rad;
  }
  const dust = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pts, 3)),
    new THREE.PointsMaterial({ color: 0xe8e8e8, size: 0.022, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  group.add(dust);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(4, -1, -3);
  scene.add(rim);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  if (reduceMotion) {
    renderer.render(scene, camera);
    canvas.classList.add('is-ready');
    return;
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  const introDur = 2.2;
  canvas.classList.add('is-ready');

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    const intro = 1 - (1 - Math.min(t / introDur, 1)) ** 3;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.2);

    group.scale.setScalar(0.7 + 0.3 * intro);
    group.position.y = Math.sin(t * 0.9) * 0.08 + scroll * 0.6;
    tooth.rotation.y = -0.5 + t * 0.32 + (1 - intro) * -2.4 + pointer.x * 0.35 + scroll * 1.6;
    tooth.rotation.x = 0.18 + pointer.y * 0.18;
    ring.rotation.z = t * 0.15;
    dust.rotation.y = -t * 0.05;
    renderer.render(scene, camera);
  };
  tick();
}
