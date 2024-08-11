import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
let renderer, scene, camera, point, cube, particles, lines;

let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
let INTERSECTED;
let polygons = [];
let startTime;
let animationPhase = 'rotate-top-left'; // Can be 'expand', 'hold', or 'collapse'

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

   
    // const material = new THREE.ShaderMaterial({
    //     uniforms: {
    //         color: { value: new THREE.Color(0xffffff) },
    //         pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/circle.png') },
    //         alphaTest: { value: 0.9 }
    //     },
    //     vertexShader: vertexShader,
    //     fragmentShader: fragmentShader
    // });







    // // Define grid size and spacing
    // const gridSize = 5;
    // const gridSpacing = 15;  // Distance between points

    // // Create three layers of 5x5 grid polygons
    // const layers = [-70, 0, 70]; // z-positions for the three layers

    // const edgesMaterial = new THREE.LineBasicMaterial({
    //     color: 0xffffff,       // Line color
    //     linewidth: 1,          // Make the lines thinner
    //     transparent: true,     // Enable transparency
    //     opacity: 0.2           // Set opacity to 50%
    // });
    
    // layers.forEach((z, index) => {
    //     const positions = [];
    //     const finalPositions = []; // Store final positions for animation
    //     const colors = [];
    //     const sizes = [];
    //     const color = new THREE.Color();
    //     const edges = [];
    //     const finalEdges = []; // Store final edge positions for animation
        

    //     for (let i = 0; i < gridSize; i++) {
    //         for (let j = 0; j < gridSize; j++) {
    //             const x = (i - (gridSize - 1) / 2) * gridSpacing;
    //             const y = (j - (gridSize - 1) / 2) * gridSpacing;
    //             const idx = i * gridSize + j;
                
    //             finalPositions.push(x, y, z);

    //             if (index === 1) {
    //                 // Center polygon starts collapsed
    //                 positions.push(0, 0, z);
    //             } else {
    //                 // Top and bottom polygons start expanded
    //                 positions.push(x, y, z);
    //             }

    //             // positions.push(x, y, z);
    //             color.setHSL(0.01 + 0.1 * idx / (gridSize + j) / (gridSize * gridSize), 1.0, 0.5);
    //             color.toArray(colors, colors.length);
    //             sizes.push(10);  // Smaller particles

    //             // Create squares by connecting points horizontally and vertically
    //             if (i < gridSize - 1) {
    //                 // Horizontal line to the next point on the right
    //                 finalEdges.push(x, y, z, x + gridSpacing, y, z);
    //                 edges.push(0, 0, z, 0, 0, z); // Start collapsed
    //             }
    //             if (j < gridSize - 1) {
    //                 // Vertical line to the next point above
    //                 finalEdges.push(x, y, z, x, y + gridSpacing, z);
    //                 edges.push(0, 0, z, 0, 0, z); // Start collapsed
    //             }
    //             if (i < gridSize - 1 && j < gridSize - 1) {
    //                 // Connect the top-right point to complete the square
    //                 finalEdges.push(x + gridSpacing, y, z, x + gridSpacing, y + gridSpacing, z);
    //                 edges.push(0, 0, z, 0, 0, z); // Start collapsed

    //                 finalEdges.push(x, y + gridSpacing, z, x + gridSpacing, y + gridSpacing, z);
    //                 edges.push(0, 0, z, 0, 0, z); // Start collapsed
    //             }
    //         }
    //     }

    //     const geometry = new THREE.BufferGeometry();
    //     geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    //     geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    //     geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    //     const points = new THREE.Points(geometry, material);
        
    //     const edgesGeometry = new THREE.BufferGeometry();
    //     edgesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3));

    //     const lines = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        
    //     const group = new THREE.Group();
    //     group.add(points);
    //     group.add(lines);

    //     scene.add(group);
    //     polygons.push({group, geometry, finalPositions, finalEdges, edgesGeometry });
    // });


    // const polygons = [];
    const gridSize = 5;
    const gridSpacing = 15;
    const zPosition = 0; // Assuming all polygons lie in the XY plane

    // Define your final positions and edges for each polygon
    // Final positions for the top/left polygon
    const finalPositionsTopLeft = populateFinalPositions(gridSize, gridSpacing, zPosition, -50);
    const finalPositionsMiddle = populateFinalPositions(gridSize, gridSpacing, zPosition, 0);
    const finalPositionsBottom = populateFinalPositions(gridSize, gridSpacing, zPosition, 50)

    const edgesTopLeft = populateFinalEdges(gridSize, gridSpacing, zPosition, -50);
    const edgesMiddle =  populateFinalEdges(gridSize, gridSpacing, zPosition, 0);
    const edgesBottom =  populateFinalEdges(gridSize, gridSpacing, zPosition, 50);

    // Define the start positions for collapsing
    const startPositionTopLeft = { x: -50, y: 50, z: zPosition };
    const startPositionMiddle = { x: 0, y: 0, z: zPosition };
    const startPositionBottom = { x: 50, y: -50, z: zPosition };

    // Define the shared material for the points
    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
            pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/circle.png') },
            alphaTest: { value: 0.9 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });

    // Initialize the polygons
    const polygonData = [
        { finalPositions: finalPositionsTopLeft, finalEdges: edgesTopLeft, startPosition: startPositionTopLeft },
        { finalPositions: finalPositionsMiddle, finalEdges: edgesMiddle, startPosition: startPositionMiddle },
        // { finalPositions: finalPositionsBottom, finalEdges: edgesBottom, startPosition: startPositionBottom }
    ];

    polygonData.forEach(data => {
        const positions = [];
        const colors = [];
        const sizes = [];
        const color = new THREE.Color();

        // Initialize the geometry with points starting at the collapsed start position
        for (let i = 0; i < data.finalPositions.length; i += 3) {
            positions.push(data.finalPositions[i].x, data.finalPositions[i].y, data.finalPositions[i].z); // Start at collapsed position
            // positions.push(data.startPosition.x, data.startPosition.y, data.startPosition.z); // Start at collapsed position
            color.setHSL(0.01 + 0.1 * i / (gridSize * gridSize), 1.0, 0.5);
            color.toArray(colors, colors.length);
            sizes.push(10); // Smaller particles
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const points = new THREE.Points(geometry, material);

        // Initialize the edges with lines starting at the collapsed start position
        const edgesGeometry = new THREE.BufferGeometry();
        const edgePositions = new Float32Array(data.finalEdges.length);
        for (let i = 0; i < edgePositions.length; i += 6) {
            edgePositions[i] = data.startPosition.x;
            edgePositions[i + 1] = data.startPosition.y;
            edgePositions[i + 2] = data.startPosition.z;
            edgePositions[i + 3] = data.startPosition.x;
            edgePositions[i + 4] = data.startPosition.y;
            edgePositions[i + 5] = data.startPosition.z;
        }
        edgesGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));

        const edgesMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            transparent: true,
            opacity: 0.2
        });
        const lines = new THREE.LineSegments(edgesGeometry, edgesMaterial);

        // Create a group to hold both the points and the edges
        const group = new THREE.Group();
        group.add(points);
        group.add(lines);

        // Add the group to the scene and store it in the polygons array
        scene.add(group);

        // Store all relevant data in the polygons array
        polygons.push({
            group: group,
            geometry: geometry,
            edgesGeometry: edgesGeometry,
            finalPositions: data.finalPositions,
            finalEdges: data.finalEdges,
            startPosition: data.startPosition
        });
    });



    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
    startTime = Date.now();
}

function populateFinalPositions(gridSize, gridSpacing, zPosition, xNextSpacing = 0) {
    const finalPositions = [];
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x = (i - (gridSize - 1) / 2) * gridSpacing + xNextSpacing;
            const y = (j - (gridSize - 1) / 2) * gridSpacing - xNextSpacing;
            finalPositions.push({x, y, z: zPosition});
        }
    }
    return finalPositions;
}
function populateFinalEdges(gridSize, gridSpacing, zPosition, xNextSpacing = 0) {
    const edges = [];
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x = (i - (gridSize - 1) / 2) * gridSpacing + xNextSpacing;
            const y = (j - (gridSize - 1) / 2) * gridSpacing - xNextSpacing;
            const z = zPosition;

            // Horizontal line
            if (i < gridSize - 1) {
                const xNext = (i + 1 - (gridSize - 1) / 2) * gridSpacing - xNextSpacing;
                edges.push(x, y, z, xNext, y, z);
            }

            // Vertical line
            if (j < gridSize - 1) {
                const yNext = (j + 1 - (gridSize - 1) / 2) * gridSpacing + xNextSpacing ;
                edges.push(x, y, z, x, yNext, z);
            }
        }
    }
    return edges;

}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate2() {
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

const topProject = {
    children: []
}
const childProject = { children: [] };
const childProject2 = { };
const grandChildProject = { };
childProject.children.push(grandChildProject);
topProject.children.push(childProject);

export class Point {
    x: number;
    y: number;
}
export class Project {
    parent: Project;
    children: Project[];
    zLevel: Number;
    isDropped: boolean;

    expandable: Boolean;
    rotateDir: number;
    dropabel: boolean;
    expandedPositions: Point[];
    collapsedPositions: Point[];
    animate() {
        // animate children
        // position = finalPOsition * progress
    }
}

function animate() {
    requestAnimationFrame(animate);

    const elapsed = (Date.now() - startTime) / 1000; // Time in seconds
    let progress;
    rotatePolygon(polygons[0]);
    // if (animationPhase === 'rotate-top-left') {
    //     // Top/Left polygon rotates on its own
    //     rotatePolygon(polygons[0]);

    //     if (elapsed >= 2) { // Rotate for 2 seconds before moving to the next phase
    //         animationPhase = 'move-to-middle';
    //         startTime = Date.now(); // Reset start time for next phase
    //     }
    // } else if (animationPhase === 'move-to-middle') {
    //     progress = Math.min(elapsed / 1, 1); // Progress from 0 to 1 over 1 second

    //     // Move the center point of the top/left polygon to the middle position
    //     movePolygonCenterTo(polygons[0], polygons[1].startPosition, progress);

    //     if (progress >= 1) {
    //         animationPhase = 'expand-middle';
    //         startTime = Date.now(); // Reset start time for next phase
    //     }
    // } else if (animationPhase === 'expand-middle') {
    //     progress = Math.min(elapsed / 1, 1); // Expand the middle polygon

    //     expandPolygon(polygons[1], progress);

    //     if (progress >= 1) {
    //         animationPhase = 'hold-middle';
    //         startTime = Date.now(); // Reset start time for next phase
    //     }
    // } else if (animationPhase === 'hold-middle') {
    //     // Hold the middle polygon expanded
    //     if (elapsed >= 4) { // Hold for 4 seconds
    //         animationPhase = 'move-to-bottom';
    //         startTime = Date.now(); // Reset start time for next phase
    //     }
    // } else if (animationPhase === 'move-to-bottom') {
    //     progress = Math.min(elapsed / 1, 1); // Move to bottom position

    //     // Move the center point of the middle polygon to the bottom position
    //     movePolygonCenterTo(polygons[1], polygons[2].startPosition, progress);

    //     if (progress >= 1) {
    //         animationPhase = 'expand-bottom';
    //         startTime = Date.now(); // Reset start time for next phase
    //     }
    // } else if (animationPhase === 'expand-bottom') {
    //     progress = Math.min(elapsed / 1, 1); // Expand the bottom polygon

    //     expandPolygon(polygons[2], progress);

    //     if (progress >= 1) {
    //         animationPhase = 'hold-bottom';
    //         startTime = Date.now(); // Reset start time for next phase
    //     }
    // } else if (animationPhase === 'hold-bottom') {
    //     // Hold the bottom polygon expanded
    //     if (elapsed >= 4) { // Hold for 4 seconds
    //         animationPhase = 'collapse-and-return-to-middle';
    //         startTime = Date.now(); // Reset start time for next phase
    //     }
    // } else if (animationPhase === 'collapse-and-return-to-middle') {
    //     progress = Math.min(elapsed / 1, 1); // Collapse bottom and move to middle

    //     // Collapse the bottom polygon
    //     collapsePolygon(polygons[2], progress);

    //     // Move the center point of the bottom polygon back to the middle position
    //     movePolygonCenterTo(polygons[2], polygons[1].startPosition, progress);

    //     if (progress >= 1) {
    //         animationPhase = 'rotate-top-left'; // Loop back to start
    //         startTime = Date.now(); // Reset start time for next phase
    //     }
    // }

    // Render the scene
    renderer.render(scene, camera);
}



function rotatePolygon(polygon, speed = 0.01) {
    polygon.group.rotation.z += speed; // Rotate around the z-axis
}

function movePolygonCenterTo(polygon, targetPosition, progress) {
    const positions = polygon.geometry.getAttribute('position').array;
    const startPosition = polygon.startPosition || { x: positions[0], y: positions[1], z: positions[2] };

    // need to initialize startPosition in above code
    // polygons.forEach((polygon, index) => {
    //     polygon.startPosition = { x: positions[0], y: positions[1], z: positions[2] }; // Example for initial position
    // });
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] = startPosition.x + (targetPosition.x - startPosition.x) * progress;
        positions[i + 1] = startPosition.y + (targetPosition.y - startPosition.y) * progress;
        positions[i + 2] = startPosition.z + (targetPosition.z - startPosition.z) * progress;
    }

    polygon.geometry.attributes.position.needsUpdate = true;
}

function expandPolygon(polygon, progress) {
    const positions = polygon.geometry.getAttribute('position').array;
    const finalPositions = polygon.finalPositions; // Final expanded positions

    for (let i = 0; i < finalPositions.length; i += 3) {
        positions[i] = finalPositions[i] * progress;
        positions[i + 1] = finalPositions[i + 1] * progress;
        positions[i + 2] = finalPositions[i + 2]; // z remains the same
    }

    polygon.geometry.attributes.position.needsUpdate = true;
}

function collapsePolygon(polygon, progress) {
    const positions = polygon.geometry.getAttribute('position').array;
    const finalPositions = polygon.finalPositions; // Final expanded positions

    for (let i = 0; i < finalPositions.length; i += 3) {
        positions[i] = finalPositions[i] * (1 - progress);
        positions[i + 1] = finalPositions[i + 1] * (1 - progress);
        positions[i + 2] = finalPositions[i + 2]; // z remains the same
    }

    polygon.geometry.attributes.position.needsUpdate = true;
}

function rotatePolygons() {
    polygons.forEach((polygon, index) => {
        if (index % 2 === 0) {
            polygon.group.rotation.z += 0.01;  // Clockwise rotation around z-axis
        } else {
            polygon.group.rotation.z -= 0.01;  // Counter-clockwise rotation around z-axis
        }
    });
}
