import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// HTML button to mute
const toggleButton = document.getElementById('toggleButton');
let isMuted = false;

const audio = new Audio('theme.mp3');
audio.loop = true;       // Optional: loop audio
audio.volume = 0.1;      // Volume: 0.0 to 1.0

function startAudioOnce() {
  audio.play().catch((err) => {
    console.warn("Audio couldn't play:", err);
  });
  // Only run once
  window.removeEventListener('mousedown', startAudioOnce);
  window.removeEventListener('keydown', startAudioOnce);
}

window.addEventListener('mousedown', startAudioOnce);
window.addEventListener('keydown', startAudioOnce);

toggleButton.addEventListener('click', () => {
  isMuted = !isMuted;
  if (isMuted) {
    audio.pause(); // Pause the audio
  } else {
    // Unmute the audio context
    if (THREE.AudioContext) {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  }

  toggleButton.textContent = isMuted ? 'Unmute' : 'Mute';
});

const toggleBtn = document.getElementById('toggleInfoBtn');
const infoContent = document.getElementById('infoContent');

let visible = true;
toggleBtn.addEventListener('click', () => {
  visible = !visible;
  infoContent.style.display = visible ? 'block' : 'none';
  toggleBtn.textContent = visible ? 'Hide' : 'Show';
});

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

const light = new THREE.PointLight( 0xff0000, 1000, 100 );
light.position.set( 0, 20, 0 );
scene.add( light );

// Spotlight
const spotLight = new THREE.SpotLight(0xffffff, 1000);
spotLight.position.set(0, 20, 0); // position of the light
spotLight.angle = Math.PI / 5;    // spotlight cone angle
spotLight.castShadow = true;
scene.add(spotLight);

const target = new THREE.Object3D();
target.position.set(0, 0, 0); // adjust as needed
scene.add(target);
spotLight.target = target;

const loader = new THREE.CubeTextureLoader();
const skyboxTexture = loader.load([
  'field-skyboxes/Footballfield/posx.jpg',
  'field-skyboxes/Footballfield/negx.jpg',
  'field-skyboxes/Footballfield/posy.jpg',
  'field-skyboxes/Footballfield/negy.jpg',
  'field-skyboxes/Footballfield/posz.jpg',
  'field-skyboxes/Footballfield/negz.jpg'
]);

scene.background = skyboxTexture;

// Ground
const textureLoader = new THREE.TextureLoader();
let texture = textureLoader.load('grass.jpg');

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(75, 64),
  new THREE.MeshStandardMaterial({ map: texture })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.5;
ground.receiveShadow = true;
scene.add(ground);

texture = textureLoader.load('cobblestone.jpg');

const groundCube = new THREE.Mesh(
  new THREE.CylinderGeometry(15, 15, 30, 64),
  new THREE.MeshStandardMaterial({ map: texture })
);
groundCube.position.set(0, -15.5, 0);
groundCube.receiveShadow = true;
groundCube.castShadow = true;
scene.add(groundCube);


const GLBLoader = new GLTFLoader();
// Load Maxwell
let model = new THREE.Group();
GLBLoader.load('maxwell_the_cat_dingus.glb', (gltf) => {
  model = gltf.scene;
  model.position.set(0, 0, 0); // adjust position as needed
  model.scale.set(0.1, 0.1, 0.1);    // optional scale
  model.traverse((child) => {
  if (child.isMesh) {
    child.castShadow = true;
    child.receiveShadow = true;
  }
  });
  scene.add(model);
}, undefined, (error) => {
  console.error('An error occurred while loading the GLB model:', error);
});

// === 20 Spinning, Oscillating Cubes ===
const orbitCubes = [];
const radius = 10;
const count = 20;

const geometries = [
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.ConeGeometry(0.7, 1.2, 16),
  new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16),
  new THREE.TorusGeometry(0.5, 0.2, 8, 16),
  new THREE.TetrahedronGeometry(0.8),
  new THREE.OctahedronGeometry(0.8),
  new THREE.DodecahedronGeometry(0.8),
  new THREE.IcosahedronGeometry(0.8)
];

for (let i = 0; i < count; i++) {
  const angle = (i / count) * Math.PI * 2;

  const cube = new THREE.Mesh(
    geometries[Math.round(Math.random() * (geometries.length-1))],
    new THREE.MeshNormalMaterial()
  );

  // Store custom orbit data
  cube.userData = {
    baseAngle: angle,
    speed: 1,
    heightOffset: 2,
    phase: i + Math.PI * 2
  };

  cube.rotation.x = Math.random() * Math.PI;
  cube.rotation.y = Math.random() * Math.PI;
  cube.castShadow = true;
  cube.receiveShadow = true;

  orbitCubes.push(cube);
  scene.add(cube);
}

// Pillars
const pillarCount = 12;
const pillarRadius = 30;
for (let i = 0; i < pillarCount; i++) {
  const angle = (i / pillarCount) * Math.PI * 2;
  const x = Math.cos(angle) * pillarRadius;
  const z = Math.sin(angle) * pillarRadius;
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 10, 64),
    new THREE.MeshStandardMaterial({ map: texture })
  );
  pillar.position.set(x, Math.random() * 4, z);
  pillar.receiveShadow = true;
  pillar.castShadow = true;
  scene.add(pillar);
}

const pillarCount2 = 16;
const pillarRadius2 = 40;
for (let i = 0; i < pillarCount2; i++) {
  const angle = (i / pillarCount2) * Math.PI * 2;
  const x = Math.cos(angle) * pillarRadius2;
  const z = Math.sin(angle) * pillarRadius2;
  const pillar2 = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 20, 64),
    new THREE.MeshStandardMaterial({ map: texture })
  );
  pillar2.position.set(x, Math.random() * 8, z);
  pillar2.receiveShadow = true;
  pillar2.castShadow = true;
  scene.add(pillar2);
}

// ===== Camera rotation control =====
let isDragging = false;
let previousMouse = { x: 0, y: 0 };
let yaw = 0;
let pitch = 0;

document.addEventListener('mousedown', (event) => {
  isDragging = true;
  previousMouse.x = event.clientX;
  previousMouse.y = event.clientY;
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

document.addEventListener('mousemove', (event) => {
  if (!isDragging) return;

  const deltaX = event.clientX - previousMouse.x;
  const deltaY = event.clientY - previousMouse.y;

  yaw -= deltaX * 0.002;
  pitch -= deltaY * 0.002;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch)); // clamp vertical look

  camera.rotation.order = 'YXZ'; // yaw (y), then pitch (x)
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  previousMouse.x = event.clientX;
  previousMouse.y = event.clientY;
});

// ===== Movement =====
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const moveSpeed = 20; // units per second

let previousTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - previousTime) / 1000;
  const time = currentTime * 0.001;

  // Spotlight color
  spotLight.color.setHSL((time/2 % 1), 1, 0.5); // Cycle through colors
  light.color.setHSL((time % 1), 1, 0.5); // Cycle through colors


  // === WASD movement ===
  direction.set(0, 0, 0);
  if (keys['KeyW']) direction.z -= 1;
  if (keys['KeyS']) direction.z += 1;
  if (keys['KeyA']) direction.x -= 1;
  if (keys['KeyD']) direction.x += 1;
  if (keys['Space']) direction.y += 1;
  if (keys['ControlLeft']) direction.y -= 1;

  if (direction.length() > 0) {
    direction.normalize();
    const move = new THREE.Vector3(direction.x, direction.y, direction.z);
    move.applyEuler(camera.rotation);
    move.multiplyScalar(moveSpeed * deltaTime);
    camera.position.add(move);
  }

  // === Update orbit cubes ===
  orbitCubes.forEach((cube, i) => {
    const data = cube.userData;
    const angle = data.baseAngle + time * data.speed;

    // Circular orbit
    cube.position.x = Math.cos(angle) * radius;
    cube.position.z = Math.sin(angle) * radius;

    // Vertical oscillation
    cube.position.y = 2 + Math.sin(time * 2 + data.phase) * 1.5;

    // Spin the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.02;
  });

  model.rotation.y -= 0.02; // Spin the model
  model.position.y = 1 + Math.sin(time * 4);

  light.position.x = Math.cos(time) * 40;
  light.position.z = Math.sin(time) * 40;

  renderer.render(scene, camera);
  previousTime = currentTime;
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
