import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
let renderer, scene, camera, point, cube, particles;

let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
let INTERSECTED;

await init();
animate();
async function init() {
    const vertexShader = await fetch('vertexShader.glsl').then(res => res.text());
    const fragmentShader = await fetch('fragmentShader.glsl').then(res => res.text());


    const container = document.getElementById('container');
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 250;

    let boxGeometry = new THREE.BoxGeometry(200, 200, 200, 16, 16, 16);
    boxGeometry.deleteAttribute('normal');
    boxGeometry.deleteAttribute('uv');
    boxGeometry = BufferGeometryUtils.mergeVertices(boxGeometry);

    const positionAttribute = boxGeometry.getAttribute('position');
    const colors = [];
    const sizes = [];
    const color = new THREE.Color();

    for (let i = 0, l = positionAttribute.count; i < l; i++) {
        color.setHSL(0.01 + 0.1 * (i / l), 1.0, 0.5);
        color.toArray(colors, i * 3);
        sizes[i] = 20 * 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

     // Use the loaded shaders in ShaderMaterial
     const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
            pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/circle.png') },
            alphaTest: { value: 0.9 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Use a simple PointsMaterial for testing
    // const material = new THREE.PointsMaterial({ color: 0xffffff, size: 10 });
    // particles = new THREE.Points(geometry, material);
    // scene.add(particles);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
function animate() {
    particles.rotation.x += 0.0005;  // Slowly rotate particles around the x-axis
    particles.rotation.y += 0.001;   // Slowly rotate particles around the y-axis

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}








// function animate() {

//     render();
//     // stats.update();

// }

function render() {

    particles.rotation.x += 0.0005;  // Slowly rotate particles around the x-axis
    particles.rotation.y += 0.001;   // Slowly rotate particles around the y-axis

    renderer.render(scene, camera);  // Render the scene

//     particles.rotation.x += 0.0005;
//     particles.rotation.y += 0.001;

//     const geometry = particles.geometry;
//     const attributes = geometry.attributes;

//     raycaster.setFromCamera( pointer, camera );

//     intersects = raycaster.intersectObject( particles );

//     if ( intersects.length > 0 ) {

//         if ( INTERSECTED != intersects[ 0 ].index ) {

//             attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;

//             INTERSECTED = intersects[ 0 ].index;

//             attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE * 1.25;
//             attributes.size.needsUpdate = true;

//         }

//     } else if ( INTERSECTED !== null ) {

//         attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;
//         attributes.size.needsUpdate = true;
//         INTERSECTED = null;

//     }

//     renderer.render( scene, camera );

}
// import * as THREE from 'three';
// import Stats from 'three/addons/libs/stats.module.js';
// import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// let renderer, scene, camera, stats;
// let particles;
// const PARTICLE_SIZE = 20;
// let raycaster, intersects;
// let pointer, INTERSECTED;

// init();

// async function init() {

//   	const container = document.getElementById('container');
// 	scene = new THREE.Scene();

// 	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
// 	camera.position.z = 250;

// 	let boxGeometry = new THREE.BoxGeometry(200, 200, 200, 16, 16, 16);
// 	boxGeometry.deleteAttribute('normal');
// 	boxGeometry.deleteAttribute('uv');
// 	boxGeometry = BufferGeometryUtils.mergeVertices(boxGeometry);

// 	const positionAttribute = boxGeometry.getAttribute('position');
// 	const colors = [];
// 	const sizes = [];
// 	const color = new THREE.Color();

// 	for (let i = 0, l = positionAttribute.count; i < l; i++) {
// 		color.setHSL(0.01 + 0.1 * (i / l), 1.0, 0.5);
// 		color.toArray(colors, i * 3);
// 		sizes[i] = PARTICLE_SIZE * 0.5;
// 	}

// 	const geometry = new THREE.BufferGeometry();
// 	geometry.setAttribute('position', positionAttribute);
// 	geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
// 	geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

// 	const vertexShader = await fetch('vertexShader.glsl').then(res => res.text());
// 	const fragmentShader = await fetch('fragmentShader.glsl').then(res => res.text());

// 	const material = new THREE.ShaderMaterial({
// 		uniforms: {
// 			color: { value: new THREE.Color(0xffffff) },
// 			pointTexture: { value: new THREE.TextureLoader().load('textures/sprites/disc.png') },
// 			alphaTest: { value: 0.9 }
// 		},
// 		vertexShader: vertexShader,
// 		fragmentShader: fragmentShader
// 	});

// 	particles = new THREE.Points(geometry, material);
// 	scene.add(particles);

// 	renderer = new THREE.WebGLRenderer();
// 	renderer.setPixelRatio(window.devicePixelRatio);
// 	renderer.setSize(window.innerWidth, window.innerHeight);
// 	renderer.setAnimationLoop(animate);
// 	container.appendChild(renderer.domElement);

// 	raycaster = new THREE.Raycaster();
// 	pointer = new THREE.Vector2();

// 	stats = new Stats();
// 	container.appendChild(stats.dom);

// 	window.addEventListener('resize', onWindowResize);
// 	document.addEventListener('pointermove', onPointerMove);
// }

// function onPointerMove(event) {
// 	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
// 	pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
// }

// function onWindowResize() {
// 	camera.aspect = window.innerWidth / window.innerHeight;
// 	camera.updateProjectionMatrix();
// 	renderer.setSize(window.innerWidth, window.innerHeight);
// }

// function animate() {
// 	render();
// 	stats.update();
// }

// function render() {
// 	particles.rotation.x += 0.0005;
// 	particles.rotation.y += 0.001;

// 	const geometry = particles.geometry;
// 	const attributes = geometry.attributes;

// 	raycaster.setFromCamera(pointer, camera);
// 	intersects = raycaster.intersectObject(particles);

// 	if (intersects.length > 0) {
// 		if (INTERSECTED != intersects[0].index) {
// 			attributes.size.array[INTERSECTED] = PARTICLE_SIZE;
// 			INTERSECTED = intersects[0].index;
// 			attributes.size.array[INTERSECTED] = PARTICLE_SIZE * 1.25;
// 			attributes.size.needsUpdate = true;
// 		}
// 	} else if (INTERSECTED !== null) {
// 		attributes.size.array[INTERSECTED] = PARTICLE_SIZE;
// 		attributes.size.needsUpdate = true;
// 		INTERSECTED = null;
// 	}

// 	renderer.render(scene, camera);
// }
