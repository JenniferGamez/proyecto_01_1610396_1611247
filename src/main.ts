import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import vertexCreativeShader from './shaders/vertex_creative.glsl';
import fragmentCreativeShader from './shaders/fragment_creative.glsl';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private geometry: THREE.BoxGeometry;
  //private geometry: THREE.SphereGeometry;
  private materials: THREE.RawShaderMaterial[];
  private mesh: THREE.Mesh;
  private activeMaterialIndex: number = 0;
  private startTime: number;
  private clickTime: number;
  private clickPosition: THREE.Vector3;
  private elasticity: number;

  private camConfig = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000,
  };

  constructor() {
    this.scene = new THREE.Scene();

    // Configuración de la cámara
    this.camera = new THREE.PerspectiveCamera(
      this.camConfig.fov,
      this.camConfig.aspect,
      this.camConfig.near,
      this.camConfig.far
    );
    this.camera.position.z = 9;

    // Configuración del renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

    // Geometría: Esfera para visualizar mejor los efectos
    this.geometry = new THREE.BoxGeometry(4, 4, 4);
    //this.geometry = new THREE.SphereGeometry(3, 32, 32);

    // Material 1: Shader de ondas (vertex + fragment)
    const waveMaterial = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        u_time: { value: 0.0 },
        u_resolution: { value: resolution },
        u_elasticity: { value: 0.0 },
        u_clickTime: { value: -1.0 },
        u_clickPosition: { value: new THREE.Vector3(-1.0, -1.0, -1.0) },
        u_shininess: { value: 32.0 },
        u_transparency: { value: 0.6 },
        u_jiggleIntensity: { value: 0.05 },
        u_lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        u_lightColor: { value: new THREE.Color(0xffffff) },
        u_objectColor: { value: new THREE.Color(0xff00ff) },
        cameraPosition: { value: this.camera.position },
      },
      glslVersion: THREE.GLSL3,
      side: THREE.DoubleSide,
    });

    // Material 2: Shader creativo (inflado + toon shading)
    const creativeMaterial = new THREE.RawShaderMaterial({
      vertexShader: vertexCreativeShader,
      fragmentShader: fragmentCreativeShader,
      transparent: true,
      uniforms: {
        u_time: { value: 0.0 },
        u_resolution: { value: resolution },
        u_inflateAmount: { value: 0.2 }, // Controla el nivel de inflado
        u_lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        u_lightColor: { value: new THREE.Color(0xffffff) },
        u_objectColor: { value: new THREE.Color(0xff00ff) }, // Rojo para diferenciar
        cameraPosition: { value: this.camera.position },
      },
      glslVersion: THREE.GLSL3,
      side: THREE.DoubleSide,
    });

    // Lista de materiales para cambiar dinámicamente
    this.materials = [waveMaterial, creativeMaterial];

    // Crear la malla con el primer material
    this.mesh = new THREE.Mesh(this.geometry, this.materials[this.activeMaterialIndex]);
    this.scene.add(this.mesh);

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;

    // Inicializar variables de tiempo y clic
    this.startTime = Date.now();
    this.clickTime = -1;
    this.clickPosition = new THREE.Vector3(-1.0, -1.0);
    this.elasticity = 0.0;

    // Eventos
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('click', this.onDocumentClick.bind(this));
    window.addEventListener('keydown', this.onKeyPress.bind(this)); // Cambio de material

    this.animate();
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const elapsedTime = (Date.now() - this.startTime) / 1000;
    
    // Actualizar los uniformes en ambos materiales
    this.materials.forEach(material => {
      material.uniforms.u_time.value = elapsedTime;
      material.uniforms.cameraPosition.value = this.camera.position;
    });

    // Aplicar amortiguación de elasticidad
    if (this.elasticity > 0.001) {
      this.elasticity -= 0.02 * this.elasticity;
    } else {
      this.elasticity = 0.0;
    }
    this.materials[0].uniforms.u_elasticity.value = this.elasticity;

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private onDocumentClick(event: MouseEvent): void {
    this.clickTime = (Date.now() - this.startTime) / 1000;
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point;
      this.materials[0].uniforms.u_clickPosition.value = intersectionPoint;
      this.materials[0].uniforms.u_clickTime.value = this.clickTime;
      this.elasticity = 1.0;
    } else {
      this.materials[0].uniforms.u_clickTime.value = -1;
    }
  }

  private onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'm' || event.key === 'M') {
      this.activeMaterialIndex = (this.activeMaterialIndex + 1) % this.materials.length;
      this.mesh.material = this.materials[this.activeMaterialIndex];
      console.log('Material cambiado:', this.activeMaterialIndex);
    }
  }
}

const myApp = new App();
