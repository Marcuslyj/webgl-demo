import * as THREE from 'three'
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// 导入connon引擎
import * as CANNON from "cannon-es";

export const addScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  return scene;
}

export const addCamera = (scene) => {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );
  // 设置相机位置
  camera.position.set(0, 5, 18);
  scene.add(camera);
  return camera;
}

export const addLight = (scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  const targetObject = new THREE.Object3D();
  targetObject.position.set(-0.2, -0.1, 0.1);
  scene.add(targetObject);
  dirLight.target = targetObject;

  dirLight.castShadow = true; // 光，投射阴影
  scene.add(dirLight);

  return { ambientLight, dirLight }
}

export const initRenderer = () => {
  // 渲染器透明
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  // 设置渲染的尺寸大小
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 开启场景中的阴影贴图
  renderer.shadowMap.enabled = true; // 场景开启阴影贴图

  // 将webgl渲染的canvas内容添加到body
  document.body.appendChild(renderer.domElement);
  return renderer
}

export const addFloor = (scene) => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20), // 几何体
    // 材料
    new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      color: new THREE.Color()
    })
  );
  floor.position.set(0, -5, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true; // 接收阴影
  scene.add(floor);
  return floor;
}

export const addWorldFloor = (world) => {
  // 物体
  const floorBody = new CANNON.Body();

  // 物理世界创建地面
  const floorShape = new CANNON.Plane();
  floorBody.addShape(floorShape);

  // 材料
  const floorMaterial = new CANNON.Material("floor");
  floorBody.material = floorMaterial;

  // 当质量为0的时候，可以使得物体保持不动
  floorBody.mass = 0;
  // 地面位置
  floorBody.position.set(0, -4.99, 0); // 上移一点，底部就看不见物体了
  // 旋转地面的位置
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(floorBody);
  return { floorBody, floorMaterial }
}

export const initOrbitControls = (camera, renderer) => {
  const controls = new OrbitControls(camera, renderer.domElement);
  // 设置控制器阻尼，让控制器更有真实效果,必须在动画循环里调用.update()。
  controls.enableDamping = true;
  return controls
}

export const initAxesHelper = (scene) => {
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  return axesHelper;
}

export const createWorld = () => {
  const world = new CANNON.World();
  world.gravity.set(0, -9.8, 0);
  return world;
}

export const createCube = ({ scene, world, cubeWorldMaterial, hitSound }) => {
  /**
   * three世界
   */
  // 创建立方体
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshStandardMaterial(
    {
      // random color
      color: new THREE.Color(Math.random(), Math.random(), Math.random())
    }
  );
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.castShadow = true; // 投射阴影
  scene.add(cube);
  /**
   * 物理世界
   */
  // 创建物理cube形状
  const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  // 创建物理世界的物体
  const cubeBody = new CANNON.Body({
    shape: cubeShape,
    position: new CANNON.Vec3(Math.random() * 10 - 5, 10, Math.random() * 10 - 5),
    //   小球质量
    mass: 100,
    //   物体材质
    material: cubeWorldMaterial,
  });
  //// 加外力
  // cubeBody.applyLocalForce(
  //   new CANNON.Vec3(300, 0, 0), //添加的力的大小和方向
  //   new CANNON.Vec3(0, 0, 0) //施加的力所在的位置
  // );
  // 将物体添加至物理世界
  world.addBody(cubeBody);


  // 添加监听碰撞事件
  const HitEvent = (e) => {
    // 获取碰撞的强度
    const impactStrength = e.contact.getImpactVelocityAlongNormal();
    if (impactStrength > 2) {
      //   重新从零开始播放
      hitSound.currentTime = 0;
      // 最大是 1
      hitSound.volume = Math.min(impactStrength, 16) / 16;
      hitSound.play();
    }
  }
  cubeBody.addEventListener("collide", HitEvent);

  return {
    mesh: cube,
    body: cubeBody,
  }
}

export const setContactMaterial = (world, cubeWorldMaterial, worldFloorMaterial) => {
  // 设置2种材质碰撞的参数
  const defaultContactMaterial = new CANNON.ContactMaterial(
    cubeWorldMaterial,
    worldFloorMaterial,
    {
      //   摩擦力
      friction: 0.3,
      // 弹性
      restitution: 0.,
    }
  );

  // 讲材料的关联设置添加的物理世界
  world.addContactMaterial(defaultContactMaterial);
  // 设置世界碰撞的默认材料，如果材料没有设置，都用这个
  world.defaultContactMaterial = defaultContactMaterial;
}