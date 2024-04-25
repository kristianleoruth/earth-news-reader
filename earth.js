import * as THREE from "three"
import {GUI} from "dat.gui"
import $ from "jquery"
import classifyPoint from "robust-point-in-polygon"

const FRAME_TIME = 0.1

const loader = new THREE.TextureLoader()
const ERADIUS = 1.5
const EARTH_TEXTURE_PATH = "./assets/earth/8k_earth_daymap.png" // check licensing https://www.solarsystemscope.com/textures/
// const EARTH_TEXTURE_PATH = "./assets/earth/Country-Index-Map.png"
// const EARTH_TEXTURE_PATH = "./assets/earth/bmap.jpg"
// const EARTH_TEXTURE_PATH = "./assets/earth/night_8k.jpg" // https://www.shadedrelief.com/natural3/pages/textures.html
const EARTH_NORMAL_PATH = "./assets/earth/8k_earth_normal_map.png" 
// check licensing https://poniesandlight.co.uk/reflect/creating_normal_maps_from_nasa_depth_data/
// http://www.celestiamotherlode.net/catalog/earthbumpspec.html
// https://planetpixelemporium.com/earth8081.html
const EARTH_HEIGHTMAP_PATH = "./assets/earth/earthheight.jpg"
const EARTH_SPECMAP_PATH = "./assets/earth/earthspec.jpg"
let ETEXT_RES = {"x":0,"y":0}
const eTexture = loader.load(EARTH_TEXTURE_PATH, (tex) => {
  ETEXT_RES.x = tex.image.width
  ETEXT_RES.y = tex.image.height
})

const MOON_ORBIT_STEP = 0.0003
const MOON_TEXT_PATH = "./assets/moon/moon-4k.png"

const CAM_ROTATE_SPEED = -0.0025
const CAM_ZOOM_MULT = 0.01
const CAM_MIN_RADIUS = ERADIUS * 1.8
const CAM_MAX_RADIUS = ERADIUS * 15

let handleMouseInput = false
let camRadius = ERADIUS * 4.5
const canvas = document.querySelector("canvas.webgl")
const vAngles = {theta: 0, phi: 0}
const scene = new THREE.Scene()
// const gui = new GUI()

scene.background = new THREE.Color(0x0)

/* Set up renderer */
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)

/* Set up Earth */
const eNormal = loader.load(EARTH_NORMAL_PATH, ReRender)
const eHeightMap = loader.load(EARTH_HEIGHTMAP_PATH, ReRender)
const eSpecularMap = loader.load(EARTH_SPECMAP_PATH, ReRender)

const earthMat = new THREE.MeshPhongMaterial({ 
  map: eTexture,
  // normalMap: eNormal,
  displacementMap: eHeightMap,
  displacementScale: .03,
  specular: 0xb0b0b0,
  specularMap: eSpecularMap,
  color: 0xffffffff,
  flatShading: false,
  // wireframe: true
})
const earthGeo = new THREE.SphereGeometry(ERADIUS, 128, 128)
const earthMesh = new THREE.Mesh(earthGeo, earthMat)
earthMesh.position.set(0,0,0)
scene.add(earthMesh)

/* Moon */
let moonDistance = 5
let moonAngles = {
  theta: 3.14,
  phi: 0.2
}

const moonGeo = new THREE.SphereGeometry(0.2, 32, 32)
const moonText = loader.load(MOON_TEXT_PATH, ReRender)

const moonMat = new THREE.MeshPhongMaterial({
  map: moonText,
})
const moonMesh = new THREE.Mesh(moonGeo, moonMat)

scene.add(moonMesh)

function UpdateMoonPosition() {
  // Add to theta
  moonAngles.theta += MOON_ORBIT_STEP
  moonAngles.theta = WrapAngle(moonAngles.theta)

  const moonPos = FromAngles(moonAngles.theta, moonAngles.phi, moonDistance)
  moonMesh.position.set(moonPos.x, moonPos.y, moonPos.z)
  moonMesh.rotateY(-MOON_ORBIT_STEP)

  // Add rotation
  ReRender()
}

/* Viewport */
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    ReRender()
}

/* Set lights */
const ambientLight = new THREE.AmbientLight(0xffffffff, 0.1)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffffff, 1.5)
dirLight.position.set(400,10,0)
scene.add(dirLight)

/* Set up camera */
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.PerspectiveCamera(45, aspect, 1, 100)
let camPos = FromAngles(0, 0, camRadius)
camera.position.set(camPos.x, camPos.y, camPos.z)
camera.lookAt(0,0,0)

/* Interaction & Map */
const axes = new THREE.AxesHelper(5)
// yellow, green, blue
axes.setColors(0xfcba03, 0x29b50d, 0x091bde)
// scene.add(axes)

const borderData = JSON.parse(await LoadFileContents("./assets/earth/borderdat.json")).countries

function CheckPoint(x, y) {
  for (let i = 0; i < borderData.length; i++) {
    let n = borderData[i].name
    let mp = borderData[i].isMultiPolygon
    if (mp) {
      let polys = borderData[i].borderPoints // list of list of lines (lists of coordinates)
      for (let j = 0; j < polys.length; j++) { 
        for (let k = 0; k < polys[j].length; k++) {
          let polygon = polys[j][k]
          if (classifyPoint(polygon, [x,y]) != 1) {
            return n
          }
        }
      }
    }
    else {
      let polygon = borderData[i].borderPoints
      if (classifyPoint(polygon, [x,y]) != 1) {
        return n
      }
    }
  }
  return ""
}

const raycaster = new THREE.Raycaster();

function HandleMouseClick(event) {
  let rd = new THREE.Vector2(
    event.clientX / window.innerWidth * 2 - 1, -event.clientY / window.innerHeight * 2 + 1);
  raycaster.setFromCamera(rd, camera)
  const inters = raycaster.intersectObjects(scene.children)
  for (let i = 0; i < inters.length; i++) {
    // is point on earth?
    if (inters[i].point.length() > ERADIUS + 0.01 || inters[i].object.type != "Mesh") {
      continue;
    }
    let cname = CheckPoint(inters[i].uv.x, inters[i].uv.y)

    if (cname != "") {
      ShowNews(cname)
    }

    console.log(`Country chosen: ${cname}`)
  }
}

function ShowNews(countryName) {

}

function GetPixelFromUV(v) {
  return V2(Math.round(2160 * v.x), Math.round(1080 * (1.0 - v.y)))
}

/* View changing handling events */
$(document.body).on("mousemove", e => {
  HandleView(e)
})

window.onclick = HandleMouseClick;

$(document.body).on("mousedown", () => {
  handleMouseInput = true
  prevMousePos = null
})

$(document.body).on("mouseup", () => {
  handleMouseInput = false
})

$(canvas).on("scroll mousewheel DOMMouseScroll", e => {
  Zoom(e.originalEvent.wheelDelta)
})

/* View handling */
function Zoom(scrollDelta) {
  camRadius += scrollDelta * CAM_ZOOM_MULT
  camRadius = Clamp(camRadius, CAM_MAX_RADIUS, CAM_MIN_RADIUS)
  UpdateCameraPosition()
}

function UpdateCameraPosition() {
  camPos = FromAngles(vAngles.theta, vAngles.phi, camRadius)
  camera.position.set(camPos.x, camPos.y, camPos.z)
  camera.lookAt(0,0,0)
  renderer.render(scene, camera)
}

let prevMousePos = null
function HandleView(mEvent) {
  if (!handleMouseInput) return
  const mpos = new THREE.Vector2(mEvent.clientX, mEvent.clientY)
  if (prevMousePos == null) {
    prevMousePos = new THREE.Vector2(mpos.x, mpos.y)
    return
  }
  // get distance between two mouse positions
  const vdiff = prevMousePos.sub(mpos)

  // change cam angles
  vAngles.theta += CAM_ROTATE_SPEED * vdiff.x // x difference
  vAngles.theta = WrapAngle(vAngles.theta)
  vAngles.phi += CAM_ROTATE_SPEED * vdiff.y // y difference
  vAngles.phi = Clamp(vAngles.phi, 1.5, -1.5) // Clamp to stop jumping and flipping at poles

  UpdateCameraPosition()

  // set previous mouse position
  prevMousePos.x = mpos.x
  prevMousePos.y = mpos.y
}

/* Util */
function FromAngles(theta, phi, scale) {
  let x = Math.cos(theta) * Math.cos(phi) * scale
  let y = Math.sin(phi) * scale
  let z = Math.cos(phi) * Math.sin(theta) * scale
  return new THREE.Vector3(x, y, z)
}

async function LoadFileContents(path) {
  try {
    const content = await (await fetch(path)).text()
    return content
  }
  catch (e) {
    console.log(e)
  }
}

function V3(p1, p2, p3) {
  return new THREE.Vector3(p1, p2, p3)
}

function V2(p1, p2) {
  return new THREE.Vector2(p1, p2)
}

function CreateLine(points, color) {
  const _geo = new THREE.BufferGeometry().setFromPoints(points)
  const _mat = new THREE.LineBasicMaterial({color: color})
  const _line = new THREE.Line(_geo, _mat)
  scene.add(_line)
  return _line
}

function Clamp(val, max, min) {
  if (val > max) return max
  else if (val < min) return min
  else return val
}

function WrapAngle(theta) {
  if (theta >= 2*Math.PI) return theta - 2 * Math.PI
  else if (theta <= 0) return theta + 2 * Math.PI
  else return theta
}

function ReRender() {
  renderer.render(scene, camera)
}

/* Loop */
function Loop() {
  UpdateMoonPosition()
}

window.setInterval(Loop, FRAME_TIME)