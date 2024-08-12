import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

class AnimationStep {
  constructor(start, end, duration, action) {
    this.start = start;
    this.end = end;
    this.duration = duration;
    this.action = action;
    this.startTime = null;
  }

  reset() {
    this.startTime = null;
  }

  update(currentTime) {
    if (this.startTime === null) {
      this.startTime = currentTime;
    }
    const elapsed = (currentTime - this.startTime) / 1000;
    const progress = Math.min(elapsed / this.duration, 1);

    // Interpolate between start and end
    const interpolatedValue = THREE.MathUtils.lerp(
      this.start,
      this.end,
      progress
    );

    this.action(interpolatedValue);

    return progress >= 1;
  }
  // update(currentTime) {
  //     if (this.startTime === null) {
  //         this.startTime = currentTime;
  //     }
  //     const elapsed = (currentTime - this.startTime) / 1000;
  //     const progress = Math.min(elapsed / this.duration, 1);

  //     this.action(progress);

  //     return progress >= 1;
  // }
}

class AnimationSequence {
  constructor() {
    this.steps = [];
    this.currentStepIndex = 0;
  }

  addStep(step) {
    this.steps.push(step);
  }

  update(currentTime) {
    if (this.currentStepIndex < this.steps.length) {
      const stepCompleted =
        this.steps[this.currentStepIndex].update(currentTime);
      if (stepCompleted) {
        this.currentStepIndex++;
      }
    } else {
      this.reset();
    }
  }

  reset() {
    this.currentStepIndex = 0;
    this.steps.forEach((step) => step.reset());
  }

  isComplete() {
    return this.currentStepIndex >= this.steps.length;
  }
}

class PolygonGroup {
  constructor(
    scene,
    gridSize,
    gridSpacing,
    zPosition,
    index,
    material,
    edgesMaterial
  ) {
    this.scene = scene;
    this.gridSize = gridSize;
    this.gridSpacing = gridSpacing;
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

    this.animationSequence = new AnimationSequence();
  }

  createPolygons() {
    const color = new THREE.Color();
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const x = (i - (this.gridSize - 1) / 2) * this.gridSpacing;
        const y = (j - (this.gridSize - 1) / 2) * this.gridSpacing;
        const idx = i * this.gridSize + j;

        this.finalPositions.push(x, y, 0); // Default to center z-position (0)

        if (this.index === 0) {
          this.positions.push(x, y, 0);
        } else {
          this.positions.push(0, 0, 0);
        }
        color.setHSL(
          0.01 +
          (0.1 * idx) / (this.gridSize + j) / (this.gridSize * this.gridSize),
          1.0,
          0.5
        );
        color.toArray(this.colors, this.colors.length);
        this.sizes.push(10);

        if (i < this.gridSize - 1) {
          this.finalEdges.push(x, y, 0, x + this.gridSpacing, y, 0);
          this.edges.push(x, y, 0, x, y, 0);
        }
        if (j < this.gridSize - 1) {
          this.finalEdges.push(x, y, 0, x, y + this.gridSpacing, 0);
          this.edges.push(x, y, 0, x, y, 0);
        }
        if (i < this.gridSize - 1 && j < this.gridSize - 1) {
          this.finalEdges.push(
            x + this.gridSpacing,
            y,
            0,
            x + this.gridSpacing,
            y + this.gridSpacing,
            0
          );
          this.edges.push(x, y, 0, x, y, 0);
          this.finalEdges.push(
            x,
            y + this.gridSpacing,
            0,
            x + this.gridSpacing,
            y + this.gridSpacing,
            0
          );
          this.edges.push(x, y, 0, x, y, 0);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.positions, 3)
    );
    geometry.setAttribute(
      "customColor",
      new THREE.Float32BufferAttribute(this.colors, 3)
    );
    geometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(this.sizes, 1)
    );
    this.points = new THREE.Points(geometry, this.material);

    const edgesGeometry = new THREE.BufferGeometry();
    edgesGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.edges, 3)
    );
    this.lines = new THREE.LineSegments(edgesGeometry, this.edgesMaterial);

    this.group.add(this.points);
    this.group.add(this.lines);

    this.geometry = geometry;
    this.edgesGeometry = edgesGeometry;
  }

  moveToZ(targetZ, duration, startZx = null) {
    const startZ = startZx ? startZx : this.group.position.z; // Capture the current Z position at the start of the animation
    this.animationSequence.addStep(
      new AnimationStep(
        startZ, // Start Z position
        targetZ, // Target Z position
        duration,
        (interpolatedZ) => {
          // Interpolate the Z position between startZ and targetZ
          this.group.position.z = interpolatedZ;
        }
      )
    );
  }

  moveToY(targetZ, duration, startZx = null) {
    const startZ = startZx ? startZx : this.group.position.z; // Capture the current Z position at the start of the animation
    this.animationSequence.addStep(
      new AnimationStep(
        startZ, // Start Z position
        targetZ, // Target Z position
        duration,
        (interpolatedZ) => {
          // Interpolate the Z position between startZ and targetZ
          this.group.position.y = interpolatedZ;
        }
      )
    );
  }

  pause(duration) {
    this.animationSequence.addStep(
      new AnimationStep(
        this.group.position.z,
        this.group.position.z,
        duration,
        (progress) => { }
      )
    );
  }

  animatePointsExpandCollapse(expand, duration) {
    this.animationSequence.addStep(
      new AnimationStep(
        expand ? 0 : 1,
        expand ? 1 : 0,
        duration,
        (interpolatedValue) => {
          const positions = this.geometry.getAttribute("position").array;
          const edges = this.edgesGeometry.getAttribute("position").array;

          for (let i = 0; i < this.finalPositions.length; i += 3) {
            positions[i] = this.finalPositions[i] * interpolatedValue;
            positions[i + 1] = this.finalPositions[i + 1] * interpolatedValue;
          }
          this.geometry.attributes.position.needsUpdate = true;

          //look at old commit to see when it was working
          // Update edges, ensuring both endpoints are handled
          for (let i = 0; i < this.finalEdges.length; i += 6) {
            // First point of the edge
            edges[i] = this.finalEdges[i] * interpolatedValue;
            edges[i + 1] = this.finalEdges[i + 1] * interpolatedValue;
            edges[i + 2] = this.finalEdges[i + 2]; // z remains the same

            // Second point of the edge
            edges[i + 3] = this.finalEdges[i + 3] * interpolatedValue;
            edges[i + 4] = this.finalEdges[i + 4] * interpolatedValue;
            edges[i + 5] = this.finalEdges[i + 5]; // z remains the same
          }
          this.edgesGeometry.attributes.position.needsUpdate = true;
        }
      )
    );
  }

  update(currentTime) {
    this.animationSequence.update(currentTime);

    // if (this.index % 2 === 0) {
    this.group.rotation.z += 0.01;
    // } else {
    //     this.group.rotation.z -= 0.01;
    // }
  }
}

class AnimationManager {
  constructor() {
    this.polygons = [];
    this.startTime = Date.now();
  }

  addPolygon(polygonGroup) {
    this.polygons.push(polygonGroup);
  }

  animate() {
    const currentTime = Date.now();
    this.polygons.forEach((polygon) => polygon.update(currentTime));
  }
}

async function init() {
  const vertexShader = await fetch("vertexShader.glsl").then((res) =>
    res.text()
  );
  const fragmentShader = await fetch("fragmentShader.glsl").then((res) =>
    res.text()
  );

  const container = document.getElementById("container");
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(250, 10, 250);
  camera.lookAt(0, 0, 0);
  camera.rotation.z = THREE.MathUtils.degToRad(45);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0xffffff) },
      pointTexture: {
        value: new THREE.TextureLoader().load(
          "https://threejs.org/examples/textures/sprites/circle.png"
        ),
      },
      alphaTest: { value: 0.9 },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  const edgesMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 1,
    transparent: true,
    opacity: 0.2,
  });

  const gridSize = 5;
  const gridSpacing = 15;
  const initialZPosition = 70;

  const animationManager = new AnimationManager();
  const polygonGroup0 = new PolygonGroup(
    scene,
    gridSize,
    gridSpacing,
    initialZPosition,
    0,
    material,
    edgesMaterial
  );
  polygonGroup0.animatePointsExpandCollapse(true, 0);
  polygonGroup0.pause(16.5)
  animationManager.addPolygon(polygonGroup0);
  const polygonGroup1 = new PolygonGroup(
    scene,
    gridSize,
    gridSpacing,
    initialZPosition,
    1,
    material,
    edgesMaterial
  );
  polygonGroup1.moveToZ(-70, 0.5);
  polygonGroup1.animatePointsExpandCollapse(true, 0.5);
  polygonGroup1.pause(14.55)
  polygonGroup1.animatePointsExpandCollapse(false, 0.5);
  polygonGroup1.moveToZ(0, 0.5, -70);

  animationManager.addPolygon(polygonGroup1);

  const polygonGroup2 = new PolygonGroup(
    scene,
    gridSize,
    gridSpacing,
    0,
    2,
    material,
    edgesMaterial
  );
  polygonGroup2.pause(3);
  polygonGroup2.moveToZ(-140, 0.5, -70);
  polygonGroup2.animatePointsExpandCollapse(true, 0.25);
  polygonGroup2.pause(2);
  polygonGroup2.animatePointsExpandCollapse(false, 0.25);
  polygonGroup2.moveToY(-140, 0.5, 0);
  polygonGroup2.moveToY(0, 0.5, 140);
  polygonGroup2.pause(2);
  polygonGroup2.moveToY(-140, 0.5, 0);
  polygonGroup2.moveToY(0, 0.5, 140);
  polygonGroup2.animatePointsExpandCollapse(true, 0.25);
  polygonGroup2.pause(3);
  polygonGroup2.animatePointsExpandCollapse(false, 0.25);
  polygonGroup2.pause(0.5);
  polygonGroup2.moveToZ(-70, 0.5, -140);
  polygonGroup2.pause(1.42);
  polygonGroup2.moveToZ(0, 0.5, -70);
  animationManager.addPolygon(polygonGroup2);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", () => onWindowResize(camera, renderer));

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
