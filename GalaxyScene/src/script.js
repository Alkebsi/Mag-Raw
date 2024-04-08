import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import galaxyVertexShader from './shaders/galaxy/vertex.glsl'
import galaxyFragmentShader from './shaders/galaxy/fragment.glsl'
import bgVertexShader from './shaders/background/vertex.glsl'
import bgFragmentShader from './shaders/background/fragment.glsl'

// ----
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Galaxy
 */
const parameters = {}
parameters.count = 100000
parameters.size = 0.005
parameters.radius = 10
parameters.branches = 4
parameters.spin = 1
parameters.randomness = 0.5
parameters.randomnessPower = 4
parameters.insideColor = '#30c2c2'
parameters.outsideColor = '#ff035f'
parameters.lerpIntensity = 1

let geometry = null
let material = null
let points = null

const generateGalaxy = () =>
{
    if(points !== null)
    {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }

    /**
     * Geometry
     */
    geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(parameters.count * 3)
    const randomness = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    const scales = new Float32Array(parameters.count * 1)

    const insideColor = new THREE.Color(parameters.insideColor)
    const outsideColor = new THREE.Color(parameters.outsideColor)

    for(let i = 0; i < parameters.count; i++)
    {
        const i3 = i * 3

        // Position
        const radius = Math.random() * parameters.radius

        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius

        positions[i3    ] = Math.cos(branchAngle) * radius
        positions[i3 + 1] = 0
        positions[i3 + 2] = Math.sin(branchAngle) * radius
    
        randomness[i3    ] = randomX
        randomness[i3 + 1] = randomY
        randomness[i3 + 2] = randomZ

        // Color
        const mixedColor = insideColor.clone()
        mixedColor.lerp(outsideColor, radius / parameters.radius*parameters.lerpIntensity)

        colors[i3    ] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b

        // Scale
        scales[i] = Math.random()
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))

    /**
     * Material
     */
    material = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms:
        {
            uTime: { value: 0 },
            uSize: { value: 30 * renderer.getPixelRatio() }
        },    
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmentShader
    })

    /**
     * Points
     */
    points = new THREE.Points(geometry, material)
    points.renderOrder = 1;
    scene.add(points)
}

gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)
gui.add(parameters, 'lerpIntensity').min(1).max(3).step(0.01).onFinishChange(generateGalaxy)


/**
 * Background
 */
const cubeTextureLoader = new THREE.CubeTextureLoader()
const ctPath = './textures/cubeMap/B/';
let cubeTexture = cubeTextureLoader
  .setPath(ctPath)
  .load([
    'px.png',
    'nx.png',
    'py.png',
    'ny.png',
    'pz.png',
    'nz.png'
  ])
cubeTexture.magFilter = THREE.NearestFilter
scene.background = cubeTexture;
scene.backgroundBlurriness = .1;

const backgroundOption = {
  A: './textures/cubeMap/A/',
  B: './textures/cubeMap/B/',
  C: './textures/cubeMap/C/',
  D: './textures/cubeMap/D/',
  E: './textures/cubeMap/E/'
}

const debugCubeMap = {
  backgroundOption: backgroundOption.B
}

gui.add(debugCubeMap, 'backgroundOption', {
  A: './textures/cubeMap/A/',
  B: './textures/cubeMap/B/',
  C: './textures/cubeMap/C/',
  D: './textures/cubeMap/D/',
  E: './textures/cubeMap/E/'
}).onChange((value) => {
  cubeTexture = cubeTextureLoader.setPath(value).load([
    'px.png',
    'nx.png',
    'py.png',
    'ny.png',
    'pz.png',
    'nz.png'
  ]);
  scene.background = cubeTexture;
  if(value === './textures/cubeMap/A/') {
    alert('Unlike Others, This CubeMap Best Be Tested With 0 Blure')
  }
})
gui.add(scene, 'backgroundBlurriness', 0, 1, 0.01).name('EnvBlure');

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // Update Postprocessing
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		composer.setSize(sizes.width, sizes.height)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 50)
camera.position.x = 0
camera.position.y = 1
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false;

/**
 * Postprocessing
 */
const postprocessing = {};

const effectController = {
  focus: 54,
	aperture: 10,
	maxblur: 0.004,
	bokehEnabled: true,
	outputEnabled: false,
};

const matChanger = function ( ) {
  postprocessing.bokeh.uniforms[ 'focus' ].value = effectController.focus;
	postprocessing.bokeh.uniforms[ 'aperture' ].value = effectController.aperture * 0.00001;
	postprocessing.bokeh.uniforms[ 'maxblur' ].value = effectController.maxblur;
};

gui.add( effectController, 'focus', 1.0, 300.0, 1 ).onChange( matChanger );
gui.add( effectController, 'aperture', 0, 10, 1 ).onChange( matChanger );
gui.add( effectController, 'maxblur', 0.0, 0.01, 0.001 ).onChange( matChanger );

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Generate the first galaxy
 */
generateGalaxy()

/**
 * Init Postprocessing
 */
        const renderPass = new RenderPass( scene, camera );

				const bokehPass = new BokehPass( scene, camera, {
					focus: 1.0,
					aperture: 0.025,
					maxblur: 0.01
				} );

				const outputPass = new OutputPass();

				const composer = new EffectComposer( renderer );
				composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
				composer.setSize(sizes.width, sizes.height)

				composer.addPass( renderPass );
				composer.addPass( bokehPass );

				postprocessing.composer = composer;
				postprocessing.bokeh = bokehPass;
				

				gui.add(effectController, 'bokehEnabled').onChange(() => {
				  if (effectController.bokehEnabled) {
				    composer.addPass( bokehPass );
				  } else {
				    composer.removePass( bokehPass );
				  }
				}).name('DOF?');
				gui.add(effectController, 'outputEnabled').onChange(() => {
				  if (effectController.outputEnabled) {
				    composer.addPass( outputPass );
				  } else {
				    composer.removePass( outputPass );
				  }
				}).name('OutputPass?');
				
				gui.close();

				matChanger();


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update material
    material.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    //renderer.render(scene, camera)
    postprocessing.composer.render( 0.1 );


    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()