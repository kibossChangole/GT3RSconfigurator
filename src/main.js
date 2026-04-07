import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.Fog(0x050505, 20, 100);

const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 4, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent looking under the floor
controls.minDistance = 5;
controls.maxDistance = 20;

// --- Lighting & Environment ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.1);
scene.add(hemiLight);

//rim light behind car
const rimLight = new THREE.SpotLight(0xffffff, 100);
rimLight.position.set(0, 5, -10); // Behind the car
rimLight.lookAt(0, 0, 0);
scene.add(rimLight);

//rim light side of car
const rimLight2 = new THREE.SpotLight(0xffffff, 400); 
rimLight2.position.set(0, 1, 10); // To the right, above, and behind
// Aim at the center where the car will be
rimLight2.target.position.set(0, 0, 0);
scene.add(rimLight2.target);

// Shadows & Optics
rimLight2.castShadow = true;
rimLight2.angle = Math.PI / 6;
rimLight2.penumbra = 0.6; // Softens the light falloff
rimLight2.shadow.bias = -0.0001;

scene.add(rimLight2);

const rimlighthelper = new THREE.SpotLightHelper(rimLight2);
//scene.add(rimlighthelper);

const spotLight = new THREE.SpotLight(0xffffff, 200);
spotLight.position.set(10, 15, 10);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 50;
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);

const rectLight = new THREE.RectAreaLight(0xffffff, 5, 10, 10);
rectLight.position.set(-10, 10, 0);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);

// Load HDRI Environment for reflections
new RGBELoader().load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    //scene.environment = texture; //add texture
     scene.background = texture; // Keep it dark instead
});

// --- Ground ---
const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ 
        color: 0x111111,
        roughness: 0.1,
        metalness: 0.5
    })
);
mesh.rotation.x = -Math.PI / 2;
mesh.receiveShadow = true;
scene.add(mesh);

//--racing line
const mesh2 = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 2),
    new THREE.MeshStandardMaterial({ 
        color: 0x780606,
        roughness: 0.1,
        metalness: 0.5
    })
);
mesh2.rotation.x = -Math.PI / 2;
mesh2.position.y = 0.01;
mesh2.receiveShadow = true;
scene.add(mesh2);

// --- Car Model Loading ---
let carModel;
let spoiler;
const loader = new GLTFLoader();

loader.load('/gt3rs.glb', (gltf) => {
    carModel = gltf.scene;
    
    // Auto-center and scale
    const box = new THREE.Box3().setFromObject(carModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Scale up if necessary (optional, but good for visibility)
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim < 2) carModel.scale.setScalar(4 / maxDim);
    
    // Recalculate box after scale
    box.setFromObject(carModel);
    box.getCenter(center);
    
    // Center horizontally
    carModel.position.x = -center.x;
    carModel.position.z = -center.z;
    // Sit on floor (bottom of box at y=0)
    carModel.position.y = -box.min.y;

    carModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            // Identify parts for configuration
            if (node.name.toLowerCase().includes('spoiler')) {
                spoiler = node;
            }

            // Improve materials if they look flat
            if (node.material) {
                node.material.envMapIntensity = 1.5;
            }
        }
    });

    scene.add(carModel);
    console.log("GT3RS Loaded successfully");
    
    // Set default color
    window.changePaint('#ffffff');

    // Hide standard loader if any
    const loaderUI = document.getElementById('loader');
    if (loaderUI) loaderUI.classList.add('hidden');
}, 
(xhr) => {
    const percent = (xhr.loaded / xhr.total) * 100;
    const progressText = document.getElementById('progress-text');
    if (progressText) progressText.innerText = `Loading GT3RS: ${Math.round(percent)}%`;
});

// --- Configurator Functions ---
window.changePaint = (hex) => {
    if (!carModel) return;
    const color = new THREE.Color(hex);
    carModel.traverse((node) => {
        if (node.isMesh && (
            node.name.toLowerCase().includes('body') || 
            node.name.toLowerCase().includes('paint') ||
            node.name.toLowerCase().includes('carpaint')
        )) {
            // Apply high-quality paint material
            node.material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.9,
                roughness: 0.1,
                envMapIntensity: 2
            });
        }
    });
};

window.toggleSpoiler = () => {
    if (spoiler) {
        spoiler.visible = !spoiler.visible;
    } else {
        // Fallback: try finding it again
        carModel.traverse(node => {
            if (node.name.toLowerCase().includes('spoiler')) {
                node.visible = !node.visible;
                spoiler = node;
            }
        });
    }
};

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- Resize handling ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});