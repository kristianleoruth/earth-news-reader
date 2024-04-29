varying vec3 fragNorm;
varying vec3 pos;
varying mat4 modelViewMat;
varying mat4 projMat;

uniform float eradius;
uniform vec3 sunPos;

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

float mag(vec3 v) { return distance(v, vec3(0.0)); }
float mag(vec2 v) { return distance(v, vec2(0.0)); }

void main() {
  distNormalizer = distance(cameraPosition, vec3(0.0));
  vec3 camRight = vec3(modelViewMat[0][0], modelViewMat[1][0], modelViewMat[2][0]);

  float referenceUnitLength = camSpaceDist(camRight, vec3(0.0));
  float alpha;

  float camSpaceERadius = referenceUnitLength * eradius;
  float pdist = camSpaceDist(pos, vec3(0.0));

  float brightFactor = 1.0;
  float scaleFactor = 1.15;

  if (pdist <= referenceUnitLength * 1.25) alpha = 1.0 - dot(fragNorm, normalize(cameraPosition));
  else alpha = 1.0 - (pdist / camSpaceERadius * (1.0/scaleFactor));

  vec3 baseColor = vec3(0.45, 0.75, 0.9);
  vec3 finColor = vec3(0.8824, 0.2902, 0.0353);
  vec3 color = baseColor;
  camSunAngle = acos(dot(cameraPosition, sunPos)/(mag(cameraPosition) * mag(sunPos)));

  float dimSpeed = 1.25;
  if (camSunAngle >= PI * 0.5) {
    float from45 = camSunAngle - PI * 0.5;
    from45 /= (PI * (1.0 / dimSpeed));
    alpha *= clamp((1.0 - from45), 0.6, 1.0);
  }

  // if (camSunAngle >= PI * 0.75) color = lerp(baseColor, finColor, (camSunAngle - 0.75 * PI) / (0.25 * PI) + 0.2);
  // else color = baseColor;

  alpha *= brightFactor;
  gl_FragColor = vec4(color, alpha);
}