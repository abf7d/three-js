import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

class PolygonGroup {
  constructor(scene, gridSize, gridSpacing, zPosition, index, material, edgesMaterial) {
    this.scene = scene;
    this.gridSize = gridSize;
    this.gridSpacing = gridSpacing;
    this.initialZPosition = zPosition; // Store initial z position
    this.index = index;
    this.material = material;
    this.edgesMaterial = edgesMaterial;

    this.group = new THREE.Group();
    this.positions = [];
    this.finalPositions = [];
    this.colors = [];
    this.sizes = [];
    this.edges = [];
    this.finalEdges = [];
    this.createPolygons();
    this.scene.add(this.group);
  }

  createPolygons() {
    const color = new THREE.Color();
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const x = (i - (this.gridSize - 1) / 2) * this.gridSpacing;
        const y = (j - (this.gridSize - 1) / 2) * this.gridSpacing;
        const idx = i * this.gridSize + j;

        this.finalPositions.push(x, y, this.initialZPosition);

        if (this.index > 0) {
          // Center polygon starts collapsed
          this.positions.push(0, 0, this.initialZPosition);
        } else {
          // Top and bottom polygons start expanded
          this.positions.push(x, y, this.initialZPosition);
        }

        color.setHSL(0.01 + (0.1 * idx) / (this.gridSize + j) / (this.gridSize * this.gridSize), 1.0, 0.5);
        color.toArray(this.colors, this.colors.length);
        this.sizes.push(10);

        // Create squares by connecting points horizontally and vertically
        if (i < this.gridSize - 1) {
          this.finalEdges.push(x, y, this.initialZPosition, x + this.gridSpacing, y, this.initialZPosition);
          this.edges.push(0, 0, this.initialZPosition, 0, 0, this.initialZPosition);
        }
        if (j < this.gridSize - 1) {
          this.finalEdges.push(x, y, this.initialZPosition, x, y + this.gridSpacing, this.initialZPosition);
          this.edges.push(0, 0, this.initialZPosition, 0, 0, this.initialZPosition);
        }
        if (i < this.gridSize - 1 && j < this.gridSize - 1) {
          this.finalEdges.push(
            x + this.gridSpacing,
            y,
            this.initialZPosition,
            x + this.gridSpacing,
            y + this.gridSpacing,
            this.initialZPosition
          );
          this.edges.push(0, 0, this.initialZPosition, 0, 0, this.initialZPosition);

          this.finalEdges.push(
            x,
            y + this.gridSpacing,
            this.initialZPosition,
            x + this.gridSpacing,
            y + this.gridSpacing,
            this.initialZPosition
          );
          this.edges.push(0, 0, this.initialZPosition, 0, 0, this.initialZPosition);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(this.sizes, 1));
    this.points = new THREE.Points(geometry, this.material);

    const edgesGeometry = new THREE.BufferGeometry();
    edgesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(this.edges, 3));
    this.lines = new THREE.LineSegments(edgesGeometry, this.edgesMaterial);

    this.group.add(this.points);
    this.group.add(this.lines);

    this.geometry = geometry;
    this.edgesGeometry = edgesGeometry;
  }

  moveToZ(newZ, progress) {
    this.group.position.z = THREE.MathUtils.lerp(this.initialZPosition - 70, newZ - 70, progress);
  }

  update(progress, animationPhase) {
    // todo if the index is 2, its the lower polygon
    // maybe expand on a longer delay so potentially
    // have a separate progress for each polygon
    if (this.index > 0) {
      const positions = this.geometry.getAttribute('position').array;
      const edges = this.edgesGeometry.getAttribute('position').array;

      for (let i = 0; i < this.finalPositions.length; i += 3) {
        positions[i] = this.finalPositions[i] * progress;
        positions[i + 1] = this.finalPositions[i + 1] * progress;
        positions[i + 2] = this.finalPositions[i + 2]; // z remains the same
      }
      this.geometry.attributes.position.needsUpdate = true;

      for (let i = 0; i < this.finalEdges.length; i += 6) {
        edges[i] = this.finalEdges[i] * progress;
        edges[i + 1] = this.finalEdges[i + 1] * progress;
        edges[i + 2] = this.finalEdges[i + 2]; // z remains the same
        edges[i + 3] = this.finalEdges[i + 3] * progress;
        edges[i + 4] = this.finalEdges[i + 4] * progress;
        edges[i + 5] = this.finalEdges[i + 5]; // z remains the same
      }
      this.edgesGeometry.attributes.position.needsUpdate = true;
    }

    if (this.index % 2 === 0) {
      this.group.rotation.z += 0.01;
    } else {
      this.group.rotation.z -= 0.01;
    }
    // The middle polygon should move first
    // the bottom polygon movement should activate on a different phase
    // but there should be a separate progress for a second stage animation
    // Or let the first and second index move here
    // and set the initial position of the bottom, second to 70 as well
    // Need to test the animation phase and add a new one for moving the second
    // Need a progress for expanding the middle polygon and dropping which is waht we have here
    // One for expanding the bottom polygon and dropping
    // one for momving back to the center, collapsing the middle one
    // then worry about amination to rotate out
    // Move polygons based on the animation phase
    if (/*animationPhase === 'moveMiddle' &&*/ this.index > 0) {
      this.moveToZ(0, progress); // Move middle polygon to center position
    }
    // if (/*animationPhase === 'moveMiddle' &&*/this.index ===  2 ) {
    //     this.moveToZ(0, progress); // Move middle polygon to center position
    // }

    // if (animationPhase === 'hold' && this.index ===  2 ) {
    //         this.moveToZ(0, progress); // Move middle polygon to center position
    //     }

    // else if (animationPhase === 'moveBottom' && this.index === 2) {
    //     this.moveToZ(-70, progress); // Move bottom polygon to bottom position
    // }
  }
}

class AnimationManager {
  constructor() {
    this.polygons = [];
    this.animationPhase = 'initial-hold';
    this.startTime = Date.now();
  }

  addPolygon(polygonGroup) {
    this.polygons.push(polygonGroup);
  }

  animate() {
    const elapsed = (Date.now() - this.startTime) / 1000; // Time in seconds
    let progress;

    if (this.animationPhase === 'initial-hold') {
      progress = 0;

      if (elapsed >= 0.5) {
        this.animationPhase = 'collapse';
        this.startTime = Date.now();
      }
    }
    if (this.animationPhase === 'expand') {
      progress = Math.min(elapsed / 0.3, 1);

      if (progress >= 1) {
        // this.animationPhase = 'moveMiddle';
        this.animationPhase = 'hold';
        this.startTime = Date.now();
      }
    } else if (this.animationPhase === 'moveMiddle') {
      progress = Math.min(elapsed / 0.5, 1);

      if (progress >= 1) {
        this.animationPhase = 'moveBottom';
        this.startTime = Date.now();
      }
    } else if (this.animationPhase === 'moveBottom') {
      progress = Math.min(elapsed / 0.5, 1);

      if (progress >= 1) {
        this.animationPhase = 'hold';
        this.startTime = Date.now();
      }
    } else if (this.animationPhase === 'hold') {
      progress = 1;

      if (elapsed >= 3) {
        this.animationPhase = 'collapse';
        this.startTime = Date.now();
      }
    } else if (this.animationPhase === 'collapse') {
      progress = 1 - Math.min(elapsed / 0.3, 1);

      if (progress <= 0) {
        this.animationPhase = 'post-collapse';
        // this.animationPhase = 'post-collapse';
        this.startTime = Date.now();
      }
    } else if (this.animationPhase === 'post-collapse') {
      progress = 0;

      if (elapsed >= 2) {
        this.animationPhase = 'expand';
        this.startTime = Date.now();
      }
    }

    this.polygons.forEach((polygon) => polygon.update(progress, this.animationPhase));
  }
}
async function init() {
  const vertexShader = await fetch('vertexShader.glsl').then((res) => res.text());
  const fragmentShader = await fetch('fragmentShader.glsl').then((res) => res.text());

  const container = document.getElementById('container');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(250, 10, 250);
  camera.lookAt(0, 0, 0);
  camera.rotation.z = THREE.MathUtils.degToRad(45);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: {value: new THREE.Color(0xffffff)},
      pointTexture: {value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/circle.png')},
      alphaTest: {value: 0.9}
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });

  const edgesMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 1,
    transparent: true,
    opacity: 0.2
  });

  const gridSize = 5;
  const gridSpacing = 15;
  const initialZPosition = 70; // All polygons start at this z position

  const animationManager = new AnimationManager();

  // Create three polygons, all starting at the same z position
  const layers = [70, 70, 70];

  layers.forEach((z, index) => {
    const polygonGroup = new PolygonGroup(scene, gridSize, gridSpacing, z, index, material, edgesMaterial);
    animationManager.addPolygon(polygonGroup);
  });

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', () => onWindowResize(camera, renderer));

  function animate() {
    requestAnimationFrame(animate);
    animationManager.animate();
    renderer.render(scene, camera);
  }

  animate();
}

function onWindowResize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
