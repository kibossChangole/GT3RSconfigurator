import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// ---configs--//

const modelConfigs = {

  "https://pub-c58536414fec44b98896704ccc1ef351.r2.dev/gt3rs.glb": {
    scale: 4,
    offset: 0,
    paintTargets: ["boot011_0"]
  },

  "https://pub-c58536414fec44b98896704ccc1ef351.r2.dev/g63.glb": {
    scale: 3.5,
    offset: 0,
    paintTargets: ["MMAT_CarPaint"]
  },

  "https://pub-c58536414fec44b98896704ccc1ef351.r2.dev/l405.glb": {
    scale: 4.2,
    offset: 0
  },

  "https://pub-c58536414fec44b98896704ccc1ef351.r2.dev/maybach2022.glb": {
    scale: 4.5,
    offset: -0.8,
    rotateY: 1.5
  },

  "https://pub-c58536414fec44b98896704ccc1ef351.r2.dev/gle63.glb": {
    scale: 3.8,
    offset: 0,
    paintTargets: ["carPaint"]
  },

  "https://pub-c58536414fec44b98896704ccc1ef351.r2.dev/2024lc250.glb": {
    scale: 4.0,
    offset: 0,
    paintTargets: ["CarPaint"]
  },

  "https://pub-c58536414fec44b98896704ccc1ef351.r2.dev/rrsport2023.glb": {
    scale: 3.2,
    offset: 0,
    paintTargets: ["Car_Paint"]
  },

  "https://pub-c58536414fec44b98896704ccc1ef351.r2.dev/mbgls.glb": {
    scale: 4,
    offset: 0,
    paintTargets: ["gls_paint"]
  },

  "https://pub-c58536414fec44b98896704ccc1ef351.r2.dev/mbs65.glb": {
    scale: 4,
    offset: 0,
    paintTargets: ["sw222_paint"]
  }

  
};

// --- Scene Setup ---
const scene = new THREE.Scene();

const MOBILE_BREAKPOINT = 768;
const DESKTOP_FOV = 3;
const MOBILE_FOV = 15;

const getResponsiveFov = () =>
  window.innerWidth <= MOBILE_BREAKPOINT ? MOBILE_FOV : DESKTOP_FOV;

const camera = new THREE.PerspectiveCamera(
  getResponsiveFov(),
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(10, 4, 15);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
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
controls.maxDistance = 60;

// --- Lighting & Environment ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.1);
scene.add(hemiLight);

//rim light behind car
const rimLight = new THREE.SpotLight(0xffffff, 200);
rimLight.position.set(0, 7, -10); // Behind the car
rimLight.lookAt(0, 0, 0);
scene.add(rimLight);

//rim light side of car
const rimLight2 = new THREE.SpotLight(0xffffff, 100);
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
new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    //scene.environment = texture; //add texture
    scene.background = new THREE.Color(0x050505); //scene black
  },
);

// --- Ground ---
const mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 1,
    metalness: 0.5,
  }),
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
    metalness: 0.5,
  }),
);
mesh2.rotation.x = -Math.PI / 2;
mesh2.position.y = 0.01;
mesh2.receiveShadow = true;
scene.add(mesh2);

let carModel;
let spoiler;
let currentModelPath = "/gt3rs.glb";
const loader = new GLTFLoader();

const getBasename = (path) => {
  const cleanPath = String(path || "").split("?")[0].split("#")[0];
  const parts = cleanPath.split("/");
  return parts[parts.length - 1];
};

const getModelConfigEntry = (path) => {
  const direct = modelConfigs[path];
  if (direct) return { key: path, config: direct };

  const requestedFile = getBasename(path).toLowerCase();
  const matchKey = Object.keys(modelConfigs).find(
    (key) => getBasename(key).toLowerCase() === requestedFile,
  );

  if (matchKey) {
    return { key: matchKey, config: modelConfigs[matchKey] };
  }

  return { key: path, config: { scale: 4, offset: 0 } };
};

//lamp
loader.load(
  "lamp.glb", // Replace with your file path
  (gltf) => {
    const lampmodel = gltf.scene;
    scene.add(lampmodel);
    lampmodel.position.set(0, -0.07, 8.2);
    lampmodel.rotation.y = Math.PI / 2;
    lampmodel.scale.set(0.01, 0.01, 0.01);

    console.log("Asset added to scene!");
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.error("An error happened", error);
  },
);

const loadVehicle = (path) => {
  // Resolve config whether path is local (/car.glb) or full URL
  const { key: resolvedConfigKey, config } = getModelConfigEntry(path);
  currentModelPath = resolvedConfigKey;

  if (carModel) {
    scene.remove(carModel);
    carModel.traverse((node) => {
      if (node.isMesh) {
        node.geometry.dispose();
        if (Array.isArray(node.material)) {
          node.material.forEach((m) => m.dispose());
        } else {
          node.material.dispose();
        }
      }
    });
  }

  loader.load(
    path,
    (gltf) => {
      carModel = gltf.scene;

      // 1. Initial Scale (Normalize size)
      const box = new THREE.Box3().setFromObject(carModel);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      carModel.scale.setScalar(config.scale / maxDim);

      // 2. Apply Rotation (ONLY if defined in config)
      if (config.rotateX) carModel.rotation.x = config.rotateX;
      if (config.rotateY) carModel.rotation.y = config.rotateY;
      if (config.rotateZ) carModel.rotation.z = config.rotateZ;

      // 3. Final Alignment (Calculate floor position AFTER rotation)
      // We create a NEW box because the rotation changed the min/max coordinates
      const finalBox = new THREE.Box3().setFromObject(carModel);
      const center = finalBox.getCenter(new THREE.Vector3());

      carModel.position.x = -center.x;
      carModel.position.z = -center.z;

      // Sit on floor + your specific offset
      carModel.position.y = -finalBox.min.y + config.offset;

      carModel.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material) node.material.envMapIntensity = 1.5;
        }
      });

      scene.add(carModel);

      // Re-apply paint
      const currentColor =
        document.getElementById("color-picker")?.value || "#ffffff";
      window.changePaint(currentColor);

      document.getElementById("loader")?.classList.add("hidden");
    },
    (xhr) => {
      const percent = (xhr.loaded / xhr.total) * 100;
      document.getElementById("progress-text").innerText =
        `Loading: ${Math.round(percent)}%`;
    },
  );
};

// --- Event Listener for UI ---
document.getElementById("model-select").addEventListener("change", (e) => {
  loadVehicle(e.target.value);
});

// Initial load
loadVehicle("/gt3rs.glb");

window.changePaint = (hex) => {
  if (!carModel) return;

  // 1. Get the names allowed for the current car
  const { config } = getModelConfigEntry(currentModelPath);
  const targets = config?.paintTargets || [];

  const color = new THREE.Color(hex);

  carModel.traverse((node) => {
    if (node.isMesh) {
      const meshName = node.name.toLowerCase();
      if (!node.material) return;

      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];

      const updatedMaterials = materials.map((material) => {
        const matName = (material.name || "").toLowerCase();

        // 2. Check if this mesh OR material is in our allowed list
        const shouldPaint = targets.some(
          (t) =>
            meshName.includes(t.toLowerCase()) ||
            matName.includes(t.toLowerCase()),
        );

        if (!shouldPaint) return material;

        // If the material is already the right type, update it in place
        if (material.type === "MeshPhysicalMaterial") {
          material.color.copy(color);
          return material;
        }

        // Otherwise, apply the high-end paint material
        return new THREE.MeshPhysicalMaterial({
          color: color,
          metalness: 0.7,
          roughness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.02,
          envMapIntensity: 0.8, // Slightly boosted for better shine
        });
      });

      node.material = Array.isArray(node.material)
        ? updatedMaterials
        : updatedMaterials[0];
    }
  });
};

window.toggleSpoiler = () => {
  if (spoiler) {
    spoiler.visible = !spoiler.visible;
  } else {
    // Fallback: try finding it again
    carModel.traverse((node) => {
      if (node.name.toLowerCase().includes("spoiler")) {
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
window.addEventListener("resize", () => {
  camera.fov = getResponsiveFov();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
