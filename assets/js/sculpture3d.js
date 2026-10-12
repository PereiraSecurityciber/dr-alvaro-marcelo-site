import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* Escultura abstrata em prata líquida: esfera com deformação orgânica animada */
export function initSculpture(canvas, { reduceMotion = false } = {}) {
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
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);

  const group = new THREE.Group();
  scene.add(group);

  const seg = isSmall ? 72 : 110;
  const geo = new THREE.SphereGeometry(1.15, seg, seg);
  const pos = geo.attributes.position;
  const base = Float32Array.from(pos.array);

  const blob = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color: 0xdedede,
      metalness: 1,
      roughness: 0.12,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.2,
    }),
  );
  group.add(blob);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.006, 8, 220),
    new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 1, roughness: 0.25 }),
  );
  ring.rotation.set(Math.PI / 2.35, 0.25, 0);
  group.add(ring);

  const count = isSmall ? 70 : 140;
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const rad = 1.7 + Math.random() * 1.1;
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

  // deformação suave por soma de ondas (barata e sem dependências)
  const v = new THREE.Vector3();
  const deform = (t) => {
    for (let i = 0; i < pos.count; i++) {
      v.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
      const n = v.clone().normalize();
      const d =
        0.16 * Math.sin(n.x * 2.4 + t * 0.9) * Math.cos(n.y * 2.1 + t * 0.7) +
        0.09 * Math.sin(n.z * 3.6 + n.y * 1.4 + t * 1.1) +
        0.05 * Math.sin((n.x + n.z) * 5.2 - t * 1.3);
      v.addScaledVector(n, d);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };

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
    deform(1.2);
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

    deform(t);
    group.scale.setScalar(0.7 + 0.3 * intro);
    group.position.y = Math.sin(t * 0.9) * 0.08 + scroll * 0.6;
    blob.rotation.y = t * 0.18 + pointer.x * 0.4 + scroll * 1.2;
    blob.rotation.x = pointer.y * 0.25;
    ring.rotation.z = t * 0.15;
    dust.rotation.y = -t * 0.05;
    renderer.render(scene, camera);
  };
  tick();
}
