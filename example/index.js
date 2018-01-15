// const gl = require('pex-gl')(1280, 720)
// const regl = require('regl')(gl)
const random = require('pex-random')
const createContext = require('pex-context')
const createCube = require('primitive-cube')
const mat4 = require('pex-math/mat4')
const vec3 = require('pex-math/vec3')
 
const splinePoints = require('..')

const p = [[0, 0, 0], [1, 0, 0], [2, 1, 0]]
const sp = splinePoints(p, { segmentLength: 0.1 })
const ctx = createContext({ width: 1280, height: 720 })
const cube = createCube(0.1, 0.02, 0.02)
document.body.style.background = 'black'

const camera = require('pex-cam/perspective')({
  fov: Math.PI / 4,
  aspect: ctx.gl.drawingBufferWidth / ctx.gl.drawingBufferHeight
})
const orbiter = require('pex-cam/orbiter')({ camera: camera })


random.seed(0)

const minR = 0.2
const maxR = 1.2
const numbers = []
const points = []
const numPoints = 9

let sum = 0
for (let i = 0; i < numPoints; i++) {
  var f = random.float(minR, maxR)
  sum += f
  numbers.push(f)
}

let angle = 0
for (let i = 0; i < numPoints; i++) {
  var x = numbers[i] * Math.cos(angle)
  var y = numbers[i] * Math.sin(angle)
  points.push([x, y, 0])
  angle += Math.PI * 2 * numbers[i] / sum
}

const smoothPoints = splinePoints(points, { segmentLength: 0.05, closed: true })

// close the line strip
smoothPoints.push(smoothPoints[0])

const clearCmd = {
  pass: ctx.pass({
    clearColor: [1, 1, 1, 1],
    clearDepth: 1
  })
}

const drawLineStripCmd = {
  pipeline: ctx.pipeline({
    depthTest: true,
    vert: `
      attribute vec3 aPosition;
      uniform mat4 uProjectionMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uModelMatrix;
      void main () {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
      }
    `,
    frag: `
      precision mediump float;
      uniform vec4 uColor;
      void main () {
        gl_FragColor.rgb = uColor.rgb;
        gl_FragColor.a = 1.0;
      }
    `,
    primitive: ctx.Primitive.LineStrip
  }),
  attributes: {
  },
  uniforms: {
    uColor: [0.3, 0.3, 0.3, 1],
    uProjectionMatrix: camera.projectionMatrix, //mat4.perspective(mat4.create(), Math.PI / 4, window.innerWidth / window.innerHeight, 0.1, 100),
    uViewMatrix: camera.viewMatrix,//mat4.lookAt(mat4.create(), [2, 2, 5], [0, 0, 0], [0, 1, 0]),
    uModelMatrix: mat4.translate(mat4.create(), [0, 0, 0])
  }
}

const drawLinesCmd = {
  pipeline: ctx.pipeline({
    depthTest: true,
    vert: `
      attribute vec3 aPosition;
      uniform mat4 uProjectionMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uModelMatrix;
      void main () {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
      }
    `,
    frag: `
      precision mediump float;
      uniform vec4 uColor;
      void main () {
        gl_FragColor.rgb = uColor.rgb;
        gl_FragColor.a = 1.0;
      }
    `,
    primitive: ctx.Primitive.Lines
  }),
  attributes: {
  },
  uniforms: {
    uColor: [0.3, 0.3, 0.3, 1],
    uProjectionMatrix: camera.projectionMatrix, //mat4.perspective(mat4.create(), Math.PI / 4, window.innerWidth / window.innerHeight, 0.1, 100),
    uViewMatrix: camera.viewMatrix,//mat4.lookAt(mat4.create(), [2, 2, 5], [0, 0, 0], [0, 1, 0]),
    uModelMatrix: mat4.translate(mat4.create(), [0, 0, 0])
  }
}

var pointRects = []
smoothPoints.forEach((p) => {
  var x = p[0]
  var y = p[1]
  var r = 0.01
  pointRects.push([x - r, y - r, 0], [x + r, y - r, 0])
  pointRects.push([x + r, y - r, 0], [x + r, y + r, 0])
  pointRects.push([x + r, y + r, 0], [x - r, y + r, 0])
  pointRects.push([x - r, y + r, 0], [x - r, y - r, 0])
})

var positionsBuf = ctx.vertexBuffer(points)
var smoothPositionsBuf = ctx.vertexBuffer(smoothPoints)
var pointRectsBuf = ctx.vertexBuffer(pointRects)

var debugOnce = false

var green = [39 / 255, 174 / 255, 96 / 255, 1]

ctx.frame(() => {
  ctx.debug(debugOnce)
  debugOnce = false
  ctx.submit(clearCmd)
  ctx.submit(drawLineStripCmd, {
    attributes: { aPosition: positionsBuf },
    count: points.length
  })
  ctx.submit(drawLineStripCmd, {
    attributes: { aPosition: smoothPositionsBuf },
    count: smoothPoints.length,
    uniforms: {
      uColor: green
    }
  })
  ctx.submit(drawLinesCmd, {
    attributes: { aPosition: pointRectsBuf },
    count: pointRects.length,
    uniforms: {
      uColor: green
    }
  })
})
