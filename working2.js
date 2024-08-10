import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
let renderer, scene, camera, point, cube, particles, lines;

let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
let INTERSECTED;
let polygons = [];
let startTime;
let animationPhase = 'expand'; // Can be 'expand', 'hold', or 'collapse'

await init();
animate();


async function init() {
    const vertexShader = await fetch('vertexShader.glsl').then(res => res.text());
    const fragmentShader = await fetch('fragmentShader.glsl').then(res => res.text());

    const container = document.getElementById('container');
    scene = new THREE.Scene();

    // Adjust the camera position for a 3/4ths view
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(250, 10, 250);  // Move the camera back, and up to get a 3/4ths view
    camera.lookAt(0, 0, 0);  // Make sure the camera is looking at the center of the scene
    
    // Rotate the camera 45 degrees in the viewport plane
    camera.rotation.z = THREE.MathUtils.degToRad(45);  // Convert 45 degrees to radians

   
    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
            pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/circle.png') },
            alphaTest: { value: 0.9 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });

    // Define grid size and spacing
    const gridSize = 5;
    const gridSpacing = 15;  // Distance between points

    // Create three layers of 5x5 grid polygons
    const layers = [-70, 0, 70]; // z-positions for the three layers

    const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,       // Line color
        linewidth: 1,          // Make the lines thinner
        transparent: true,     // Enable transparency
        opacity: 0.2           // Set opacity to 50%
    });
    
    layers.forEach((z, index) => {
        const positions = [];
        const finalPositions = []; // Store final positions for animation
        const colors = [];
        const sizes = [];
        const color = new THREE.Color();
        const edges = [];
        const finalEdges = []; // Store final edge positions for animation
        

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x = (i - (gridSize - 1) / 2) * gridSpacing;
                const y = (j - (gridSize - 1) / 2) * gridSpacing;
                const idx = i * gridSize + j;
                
                finalPositions.push(x, y, z);

                if (index === 1) {
                    // Center polygon starts collapsed
                    positions.push(0, 0, z);
                } else {
                    // Top and bottom polygons start expanded
                    positions.push(x, y, z);
                }

                // positions.push(x, y, z);
                color.setHSL(0.01 + 0.1 * idx / (gridSize + j) / (gridSize * gridSize), 1.0, 0.5);
                color.toArray(colors, colors.length);
                sizes.push(10);  // Smaller particles

                // Create squares by connecting points horizontally and vertically
                if (i < gridSize - 1) {
                    // Horizontal line to the next point on the right
                    finalEdges.push(x, y, z, x + gridSpacing, y, z);
                    edges.push(0, 0, z, 0, 0, z); // Start collapsed
                }
                if (j < gridSize - 1) {
                    // Vertical line to the next point above
                    finalEdges.push(x, y, z, x, y + gridSpacing, z);
                    edges.push(0, 0, z, 0, 0, z); // Start collapsed
                }
                if (i < gridSize - 1 && j < gridSize - 1) {
                    // Connect the top-right point to complete the square
                    finalEdges.push(x + gridSpacing, y, z, x + gridSpacing, y + gridSpacing, z);
                    edges.push(0, 0, z, 0, 0, z); // Start collapsed

                    finalEdges.push(x, y + gridSpacing, z, x + gridSpacing, y + gridSpacing, z);
                    edges.push(0, 0, z, 0, 0, z); // Start collapsed
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const points = new THREE.Points(geometry, material);
        
        const edgesGeometry = new THREE.BufferGeometry();
        edgesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3));

        const lines = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        
        const group = new THREE.Group();
        group.add(points);
        group.add(lines);

        scene.add(group);
        polygons.push({group, geometry, finalPositions, finalEdges, edgesGeometry });
    });

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
    startTime = Date.now();
}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const elapsed = (Date.now() - startTime) / 1000; // Time in seconds
    let progress;

    if (animationPhase === 'expand') {
        progress = Math.min(elapsed / .3, 1); // Progress from 0 to 1 over 1 second (faster)

        if (progress >= 1) {
            animationPhase = 'hold';
            startTime = Date.now(); // Reset start time for next phase
        }
    } else if (animationPhase === 'hold') {
        progress = 1; // Keep fully expanded

        if (elapsed >= 3) { // Hold for 4 seconds
            animationPhase = 'collapse';
            startTime = Date.now(); // Reset start time for next phase
        }
    } else if (animationPhase === 'collapse') {
        progress = 1 - Math.min(elapsed / .3, 1); // Progress from 1 to 0 over 1 second (faster)

        if (progress <= 0) {
            animationPhase = 'post-collapse'; // Move to post-collapse phase
            startTime = Date.now(); // Reset start time for next phase
        }
    } else if (animationPhase === 'post-collapse') {
        progress = 0; // Keep fully collapsed during post-collapse

        if (elapsed >= 2) { // Pause for 3 seconds before expanding again
            animationPhase = 'expand'; // Loop back to expand phase
            startTime = Date.now(); // Reset start time for next phase
        }
    }


    polygons.forEach((polygon, index) => {
        if (index === 1) { // Only animate the center polygon
            const positions = polygon.geometry.getAttribute('position').array;
            const edges = polygon.edgesGeometry.getAttribute('position').array;

            // Update positions for particles
            for (let i = 0; i < polygon.finalPositions.length; i += 3) {
                positions[i] = polygon.finalPositions[i] * progress;
                positions[i + 1] = polygon.finalPositions[i + 1] * progress;
                positions[i + 2] = polygon.finalPositions[i + 2]; // z remains the same
            }
            polygon.geometry.attributes.position.needsUpdate = true;

            // Update positions for edges
            for (let i = 0; i < polygon.finalEdges.length; i += 6) {
                edges[i] = polygon.finalEdges[i] * progress;
                edges[i + 1] = polygon.finalEdges[i + 1] * progress;
                edges[i + 2] = polygon.finalEdges[i + 2]; // z remains the same
                edges[i + 3] = polygon.finalEdges[i + 3] * progress;
                edges[i + 4] = polygon.finalEdges[i + 4] * progress;
                edges[i + 5] = polygon.finalEdges[i + 5]; // z remains the same
            }
            polygon.edgesGeometry.attributes.position.needsUpdate = true;
        }

        if (index % 2 === 0) {
            polygon.group.rotation.z += 0.01;  // Clockwise rotation around z-axis
        } else {
            polygon.group.rotation.z -= 0.01;  // Counter-clockwise rotation around z-axis
        }
    });
    renderer.render(scene, camera);
}



