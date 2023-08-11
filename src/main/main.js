import * as THREE from 'three'
// 导入动画库
import gsap from "gsap";
// 导入dat.gui
import * as dat from "dat.gui";
// 导入connon引擎
import * as CANNON from "cannon-es";
import { setResize } from '../utils/resize';
import { addScene, addCamera, addFloor, addLight, initRenderer, initOrbitControls, initAxesHelper, createWorld, addWorldFloor, createCube, setContactMaterial } from './utils'

// 击打声音
const hitSound = new Audio("public/audio/metalHit.mp3");

// 1、创建场景
const scene = addScene();
// 2、创建相机
const camera = addCamera(scene);
// 3、添加环境光和平行光
const { ambientLight, dirLight } = addLight(scene);
// 添加地板
const floor = addFloor(scene);

// 创建物理世界
const world = createWorld();
//设置物体材质
const cubeWorldMaterial = new CANNON.Material("cube");
// 立方体数组
const cubeArr = [];

// 物理世界创建地面
const { floorBody: worldFloor, floorMaterial: worldFloorMaterial } = addWorldFloor(world);
// 设置碰撞参数
setContactMaterial(world, cubeWorldMaterial, worldFloorMaterial);


const onCreateCube = () => {
  const cubeItem = createCube({ scene, world, cubeWorldMaterial, hitSound });
  cubeArr.push(cubeItem);
}




// 初始化渲染器
const renderer = initRenderer();
// 创建轨道控制器
const controls = initOrbitControls(camera, renderer);
// 添加坐标轴辅助器
const axesHelper = initAxesHelper(scene);
// 设置时钟
const clock = new THREE.Clock();

function render() {
  const deltaTime = clock.getDelta();
  // 更新物理引擎里世界的物体
  world.step(1 / 120, deltaTime);

  cubeArr.forEach((item) => {
    item.mesh.position.copy(item.body.position);
    // 设置渲染的物体跟随物理的物体旋转
    item.mesh.quaternion.copy(item.body.quaternion);
  });

  renderer.render(scene, camera);
  //   渲染下一帧的时候就会调用render函数
  requestAnimationFrame(render);
}

render();

// 监听画面变化，更新渲染画面[更新相机参数、渲染器参数]
setResize({ camera, renderer })
// 点击鼠标就创建立方体
let hasStart = false;
window.addEventListener("click", () => {
  if (!hasStart) {
    hasStart = true;
    let count = 0
    let interval =
      setInterval(() => {
        if (count < 5) {
          onCreateCube()
          count++
        } else {
          hasStart = false
          clearInterval(interval)
        }
      }, 10)
  }
});
