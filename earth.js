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
const EARTH_ROT_SPEED = 0.00015
let ETEXT_RES = {"x":0,"y":0}
const eTexture = loader.load(EARTH_TEXTURE_PATH, (tex) => {
  ETEXT_RES.x = tex.image.width
  ETEXT_RES.y = tex.image.height
})

const ATM_RADIUS = ERADIUS * 1.4
const ATM2_RADIUS = ERADIUS * 1.05

const MOON_ORBIT_STEP = -0.0003
const MOON_TEXT_PATH = "./assets/moon/moon-4k.png"

const CAM_ROTATE_SPEED = -0.0035
const FOV_FACTOR_IN = 1.02
const FOV_FACTOR_OUT = 0.98

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

/* Set up camera */
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
let camPos = FromAngles(0, 0, camRadius)
camera.position.set(camPos.x, camPos.y, camPos.z)
camera.lookAt(0,0,0)
camera.zoom = 1.0

/* Set lights */
const ambientLight = new THREE.AmbientLight(0xffffffff, 0.01)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffffff, 1.5)
dirLight.position.set(400,150,0)
scene.add(dirLight)

/* Stars */
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff
})
const starGeometry = new THREE.BufferGeometry()

const starPoints = []
for (let i = 0; i < 10000; i++) {
  let x = (Math.random() - 0.5) * 2000
  let y = (Math.random() - 0.5) * 2000
  let z = (Math.random() - 0.5) * 2000
  if ((new THREE.Vector3(x,y,z)).length() <= 200) continue
  starPoints.push(x, y, z)
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPoints, 3))
const stars = new THREE.Points(starGeometry, starMaterial)
scene.add(stars)


/* Set up Earth */
const eNormal = loader.load(EARTH_NORMAL_PATH, ReRender)
const eHeightMap = loader.load(EARTH_HEIGHTMAP_PATH, ReRender)
const eSpecularMap = loader.load(EARTH_SPECMAP_PATH, ReRender)

// const eShaderMat = new THREE.ShaderMaterial({

// })
const earthMat = new THREE.MeshPhongMaterial({ 
  map: eTexture,
  // normalMap: eNormal,
  displacementMap: eHeightMap,
  displacementScale: .005,
  specular: 0xb0b0b0,
  specularMap: eSpecularMap,
  // color: 0x000000,
  flatShading: false,
  // wireframe: true
})
const earthGeo = new THREE.SphereGeometry(ERADIUS, 64, 64) // change to evenly distributed sphere
const earthMesh = new THREE.Mesh(earthGeo, earthMat)
earthMesh.position.set(0,0,0)
scene.add(earthMesh)

/* Cities */
async function ParseCityData() {
  let fileDat = await LoadFileContents("./assets/earth/cities/worldcities.csv")
  const rows = fileDat.split(/\n/)
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r].replaceAll('"', "").split(/,/)
    rows[r] = {
      "name": row[0], 
      "theta": (parseFloat(row[3]) + 180) * (Math.PI / 180), 
      "phi": parseFloat(row[2]) + 90 * (Math.PI / 180)
    }
  }
  rows.shift()
  return rows
}

const cities = await ParseCityData()
// const cities = LoadCities()

// function LoadCities() {
//   for (let i = 0; i < cities.length; i++) {
//     const city = cities[i]
//     const 
//   }
// }

/* Clouds */
function RotateClouds() {
  clouds.rotateOnAxis(new THREE.Vector3(0, 1, 0), EARTH_ROT_SPEED * 1.5)
}

const clText = await loader.loadAsync("./assets/earth/fair_clouds_8k.jpg")
const clGeo = new THREE.SphereGeometry(ERADIUS + 0.008, 32, 32)
const clMat = new THREE.MeshPhongMaterial({
  map: clText,
  alphaMap: clText,
  transparent: true
})
const clouds = new THREE.Mesh(clGeo, clMat)
clouds.position.set(0,0,0)
scene.add(clouds)

/* Atmosphere */
const atmFS = await LoadFileContents("./assets/adv_atm_fs.glsl")
const atmVS = await LoadFileContents("./assets/adv_atm_vs.glsl")
const atmGeo = new THREE.SphereGeometry(ATM_RADIUS, 32, 32)
const atmMat = new THREE.ShaderMaterial({
  fragmentShader: atmFS,
  vertexShader: atmVS,
  uniforms: {
    "atmradius": {value: ATM_RADIUS},
    "eradius": { value: ERADIUS },
    "sunPos": {value: dirLight.position },
    "epos": {value: new THREE.Vector3(0) }
  },
  transparent: true
})
const atmosphere = new THREE.Mesh(atmGeo, atmMat)
scene.add(atmosphere)

const atm2FS = await LoadFileContents("./assets/atm2_FS.glsl")
const atm2VS = await LoadFileContents("./assets/atm2_VS.glsl")
const atm2Geo = new THREE.SphereGeometry(ATM2_RADIUS, 32, 32)
const atm2Mat = new THREE.ShaderMaterial({
  fragmentShader: atm2FS,
  vertexShader: atm2VS,
  uniforms: {
    "radius": {"value": ATM2_RADIUS}
  },
  transparent: true,
})
const atm2 = new THREE.Mesh(atm2Geo, atm2Mat)
atm2.position.set(0,0,0)
// scene.add(atm2)

/* Moon */
let moonDistance = 5
let moonAngles = {
  theta: 3.14,
  phi: 0.2
}

/* Sun */
const sunFS = await LoadFileContents("./assets/sunFS.glsl")
const sunVS = await LoadFileContents("./assets/sunVS.glsl")
const sunGeo = new THREE.SphereGeometry(10, 16, 16)
const sunMat = new THREE.ShaderMaterial({
  uniforms: {
    "sunOrigin": {value: new THREE.Vector3(650,0,0)}
  },
  fragmentShader: sunFS,
  vertexShader: sunVS,
  transparent: true
})
const sun = new THREE.Mesh(sunGeo, sunMat)
sun.position.set(650,0,0)
scene.add(sun)

// Moon

const moonGeo = new THREE.SphereGeometry(0.2, 16, 16)
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



/* Interaction & Map */
const axes = new THREE.AxesHelper(5)
// yellow, green, blue
axes.setColors(0xfcba03, 0x29b50d, 0x091bde)
// scene.add(axes)

const borderData = JSON.parse(await LoadFileContents("./assets/earth/borderdat.json")).countries
const countries = CreateCountries()

function RotateEarth() {
  earthMesh.rotateY(EARTH_ROT_SPEED)
  for (let i = 0; i < countries.length; i++) {
    if (countries[i].isMultiPolygon) {
      for (let j = 0; j < countries[i].border.length; j++) {
        countries[i].border[j].rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), EARTH_ROT_SPEED)
      }
    }
    else {
      countries[i].border.rotateOnWorldAxis(new THREE.Vector3(0,1,0), EARTH_ROT_SPEED)
    }
  }
}

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

/**
 * @returns array of objects with properties `name`, `isMultiPolygon`, and `border`
 */
function CreateCountries() {
  const borderOffset = 0.007
  const borderColor = 0xffffff
  const _countries = []
  for (let i = 0; i < borderData.length; i++) {
    if (!borderData[i].isMultiPolygon) {
      const points = []
      for (let j = 0; j < borderData[i].borderPoints.length; j++) {
        points.push(
          FromAngles(-(0.5 + borderData[i].borderPoints[j][0]) * Math.PI * 2.0, 
            -(0.5 - borderData[i].borderPoints[j][1]) * Math.PI, 
            ERADIUS + borderOffset))
      }
      const border = CreateLine(points, borderColor)
      _countries.push({
        name: borderData[i].name,
        isMultiPolygon: borderData[i].isMultiPolygon,
        border: border
      })
    }
    else {
      const borders = []
      const meshes = []
      for (let j = 0; j < borderData[i].borderPoints.length; j++) {
        for (let k = 0; k < borderData[i].borderPoints[j].length; k++) {
          const normPoints = borderData[i].borderPoints[j][k]
          const points = []
          for (let l = 0; l < normPoints.length; l++) {
            points.push(FromAngles(
              -(0.5 + normPoints[l][0]) * Math.PI * 2.0,
              -(0.5 - normPoints[l][1]) * Math.PI,
              ERADIUS + borderOffset))
          }
          const border = CreateLine(points, borderColor)
          borders.push(border)
        }
      }
      _countries.push({
        name: borderData[i].name,
        isMultiPolygon: borderData[i].isMultiPolygon,
        border: borders
      })
    }
  }
  return _countries
}

const raycaster = new THREE.Raycaster();

function HandleMouseClick(event) {
  let rd = new THREE.Vector2(
    event.clientX / window.innerWidth * 2 - 1, -event.clientY / window.innerHeight * 2 + 1);
  raycaster.setFromCamera(rd, camera)
  const inters = raycaster.intersectObjects(scene.children)
  for (let i = 0; i < inters.length; i++) {
    // is point on earth?
    // console.log(inters[i].object)
    if (inters[i].object != earthMesh) {
      continue;
    }
    let cname = CheckPoint(inters[i].uv.x, inters[i].uv.y)

    if (cname == "") {
      return
    }

    fetch('http://127.0.0.1:3000/' + cname, {
      method: 'get',
      url: 'http://127.0.0.1:3000/' + cname,
    }).then(res => {
      return res.text()
    }).then(text => {ShowNews(cname, JSON.parse(text))})

    console.log(`Country chosen: ${cname}`)
  }
} 

const newsContainer = $('.news-container')

function ShowNews(countryName, newsAPIData) {
  newsContainer.attr("style", "display: block")
  newsContainer.find("h1").text(`News from ${countryName}`)

  const table = document.querySelector('table.news-table')
  table.innerHTML = ""

  for (let i = 0; i < newsAPIData.articles.length; i++) {
    let article = newsAPIData.articles[i]
    if (article.publishedAt.startsWith('1970')) continue
    const row = document.createElement("tr")
    const headline = document.createElement("td")
    headline.setAttribute("class", "article-headline")
    const articleUrl = document.createElement("td")
    articleUrl.setAttribute("class", "article-url")
    
    const articleElem = document.createElement("a")
    articleElem.setAttribute("href", article.url)
    articleElem.setAttribute("target", "_blank")
    articleElem.textContent = 'Read more'
    articleUrl.appendChild(articleElem)

    headline.textContent = article.title

    row.appendChild(headline)
    row.appendChild(articleUrl)

    table.appendChild(row)
  }
}

function GetPixelFromUV(v) {
  return V2(Math.round(2160 * v.x), Math.round(1080 * (1.0 - v.y)))
}

/* View changing handling events */
$(document.body).on("mousemove", e => {
  HandleView(e)
})

document.querySelector('canvas.webgl').onclick = HandleMouseClick;

$(document.body).on("mousedown", () => {
  handleMouseInput = true
  prevMousePos = null
})

$(document.body).on("mouseup", () => {
  handleMouseInput = false
})

$(window).on("scroll mousewheel DOMMouseScroll", e => {
  Zoom(e.originalEvent.wheelDelta)
})

/* View handling */
function Zoom(scrollDelta) {
  // zoom += scrollDelta * ZOOM_CHANGE_SPEED
  // zoom = Clamp(zoom, MIN_ZOOM, MAX_ZOOM)
  // camera.zoom = zoom
  // console.log(camera.zoom)
  if (scrollDelta > 0) {
    camera.fov *= FOV_FACTOR_IN
  }
  else camera.fov *= FOV_FACTOR_OUT
  camera.fov = Clamp(camera.fov, 100, 20)
  camera.updateProjectionMatrix()
  // camRadius += scrollDelta * CAM_ZOOM_MULT
  // camRadius = Clamp(camRadius, CAM_MAX_RADIUS, CAM_MIN_RADIUS)
  // UpdateCameraPosition()
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
// const atmVerts = atmosphere.geometry.attributes.position
function Loop() {
  // for (let i = 0; i < atmosphere.geometry.attributes.position; i += 3000) {
  //   const pos = new THREE.Vector3(atmVerts[i], atmVerts[i+1], atmVerts[i+2])
  //   // console.log(pos, pos.normalize().dot(dirLight.position.normalize()))
  // }
  RotateEarth()
  RotateClouds()
  UpdateMoonPosition()
}

window.setInterval(Loop, FRAME_TIME)