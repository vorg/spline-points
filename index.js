function distance (a, b) {
  return distance3(a, b[0], b[1], b[2])
}

function distance3 (a, x, y, z) {
  var dx = x - a[0]
  var dy = y - a[1]
  var dz = z - a[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function interpolate (p0, p1, p2, p3, t) {
  var v0 = (p2 - p0) * 0.5
  var v1 = (p3 - p1) * 0.5
  var t2 = t * t
  var t3 = t * t2
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1
}

function splinePoints (points, options) {
  var isClosedPath = options && options.closed
  var segmentLength = (options && options.segmentLength) ? options.segmentLength : 0

  var newPoints = []
  for (let i = 0; i < points.length; i++) {
    var c0, c1, c2, c3
    if (isClosedPath) {
      c0 = (i - 1 + points.length) % points.length
      c1 = i % points.length
      c2 = (i + 1) % points.length
      c3 = (i + 2) % points.length
    } else {
      c0 = i === 0 ? i : i - 1
      c1 = i
      c2 = i > points.length - 2 ? i : i + 1
      c3 = i > points.length - 3 ? i : i + 2
    }
    var numSteps = 3
    if (segmentLength) {
      var dist = distance(points[c1], points[c2])
      numSteps = Math.max(1, dist / segmentLength)
    }
    if (segmentLength) {
      numSteps *= 100 // generate 10x more points than necessary
    }
    var step = 1 / numSteps
    for (var t = 0; t < 1; t += step) {
      var x = interpolate(points[c0][0], points[c1][0], points[c2][0], points[c3][0], t)
      var y = interpolate(points[c0][1], points[c1][1], points[c2][1], points[c3][1], t)
      var z = interpolate(points[c0][2], points[c1][2], points[c2][2], points[c3][2], t)
      newPoints.push([x, y, z])
    }
  }

  var finalPoints = []
  var travelledDist = 0
  var prevPoint = points[0]
  finalPoints.push(prevPoint)
  for (let i = 0; i < newPoints.length; i++) {
    var p = newPoints[i]
    travelledDist += distance(prevPoint, p)
    if (travelledDist >= segmentLength) {
      finalPoints.push(p)
      travelledDist -= segmentLength
    }
    prevPoint = p
  }

  return finalPoints
}

module.exports = splinePoints
