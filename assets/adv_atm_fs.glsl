varying vec3 fragNorm;
varying vec3 pos;
varying mat4 modelViewMat;
varying mat4 projMat;

uniform float eradius;
uniform vec3 sunPos;
uniform vec3 epos;
uniform float atmradius;

float distNormalizer;
float camSunAngle;

#define PI 3.14159
// #define PI 180.0

float camSpaceDist(vec3 p1, vec3 p2) {
  vec2 p1cam = (modelViewMat * vec4(p1, 1.0)).xy;
  vec2 p2cam = (modelViewMat * vec4(p2, 1.0)).xy;
  return distance(p1cam, p2cam) / distNormalizer;
}

vec2 toCamSpace(vec3 v) {
  return (modelViewMat * vec4(v, 1.0)).xy;
}

vec3 lerp(vec3 base, vec3 final, float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 difference = final - base;
  return base + (difference * t);
}

// Returns vector (dstToSphere, dstThroughSphere)
	// If ray origin is inside sphere, dstToSphere = 0
	// If ray misses sphere, dstToSphere = maxValue; dstThroughSphere = 0
vec2 raySphere(vec3 sphereCentre, float sphereRadius, vec3 rayOrigin, vec3 rayDir) {
  vec3 offset = rayOrigin - sphereCentre;
  float a = 1.0; // Set to dot(rayDir, rayDir) if rayDir might not be normalized
  float b = 2.0 * dot(offset, rayDir);
  float c = dot (offset, offset) - sphereRadius * sphereRadius;
  float d = b * b - 4.0 * a * c; // Discriminant from quadratic formula

  // Number of intersections: 0 when d < 0; 1 when d = 0; 2 when d > 0
  if (d > 0.0) {
    float s = sqrt(d);
    float dstToSphereNear = max(0.0, (-b - s) / (2.0 * a));
    float dstToSphereFar = (-b + s) / (2.0 * a);

    // Ignore intersections that occur behind the ray
    if (dstToSphereFar >= 0.0) {
      return vec2(dstToSphereNear, dstToSphereFar - dstToSphereNear);
    }
  }
  // Ray did not intersect sphere
  return vec2(100000000.0, 0.0);
}

float brightnessScale(float x) {
  return 0.2 * log(x - 0.25) + 1.0;
}

float bscale(float x) {
  float BSCALE = 0.5;
  return 0.00025 * exp(10.0 * x) * BSCALE;
  // return x*x*BSCALE;
}

float dtpa2(vec3 rayOrigin, vec3 rayDir) {
  float IN_ATM_FACTOR = 0.8;
  float OUT_ATM_FACTOR = 1.0;
  float BRIGHT_SCALE = 1.5;
  vec2 atmInt = raySphere(epos, atmradius, rayOrigin, rayDir);
  vec3 closestPoint = rayOrigin + rayDir * (atmInt.x + (atmInt.y - atmInt.x) * 0.5);
  float dFromOrig = distance(closestPoint, epos);

  // float depth = exp(-dFromOrig);
  float dpr = dot(fragNorm, normalize(cameraPosition - pos));
  float lightDpr = brightnessScale((dot(fragNorm, normalize(sunPos - pos)) + 1.0) * BRIGHT_SCALE);
  
  if (dFromOrig <= 3.168) {
    return bscale(dFromOrig / (atmradius * 2.0)) * lightDpr * IN_ATM_FACTOR;
  }

  return lightDpr * dpr * OUT_ATM_FACTOR;
  // return 0.0;
}

float dtpa(vec3 rayOrigin, vec3 rayDir) {
  float ATM_FACTOR = 1.0;
  vec2 atmInt = raySphere(epos, atmradius, rayOrigin, rayDir);
  vec2 planetInt = raySphere(epos, eradius, rayOrigin, rayDir);

  float dist = 0.0;
  if (atmInt.x < 0.01) { // inside atmosphere
    dist = atmInt.y;
  }
  else {
    dist = atmInt.y - atmInt.x;
  }

  // float dprod = exp(-dot(fragNorm, normalize(sunPos - pos)));
  float camProd = dot(fragNorm, -rayDir);
  float dprod = max(dot(fragNorm, normalize(sunPos - pos)), 0.0);
  return dist / (atmradius * 2.0);
}

// float lightScattering(vec3 rayOrigin, vec3 rayDir, float rayLength) {
  
// }

void main() {
  float alpha;

  vec4 baseColor = vec4(0.5412, 0.8157, 0.949, 1.0);
  vec4 finalColor = vec4(0.95, 0.51, 0.25, 1.0);
  vec4 color = baseColor;

  float EPSILON = 0.0001;
  vec3 dirToFrag = normalize(pos - cameraPosition);

  float light = dtpa2(cameraPosition, dirToFrag);
  float distThroughAtm = dtpa(cameraPosition, dirToFrag);
  color = vec4(baseColor.xyz * light, light);
  // color = vec4(baseColor.xyz, light);
  gl_FragColor = color;
}