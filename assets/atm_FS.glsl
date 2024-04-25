varying vec3 fragNorm;
varying vec3 pos;
varying mat4 modelViewMat;
varying mat4 projMat;

uniform float eradius;

float distNormalizer;

float camSpaceDist(vec3 p1, vec3 p2) {
  vec2 p1cam = (modelViewMat * vec4(p1, 1.0)).xy;
  vec2 p2cam = (modelViewMat * vec4(p2, 1.0)).xy;
  return distance(p1cam, p2cam) / distNormalizer;
}

vec2 toCamSpace(vec3 v) {
  return (modelViewMat * vec4(v, 1.0)).xy;
}

void main() {
  distNormalizer = distance(cameraPosition, vec3(0.0));
  vec3 camRight = vec3(modelViewMat[0][0], modelViewMat[1][0], modelViewMat[2][0]);

  float referenceUnitLength = camSpaceDist(camRight, vec3(0.0));
  float alpha;

  float camSpaceERadius = referenceUnitLength * eradius;
  float pdist = camSpaceDist(pos, vec3(0.0));

  float brightFactor = 1.05;

  if (pdist <= referenceUnitLength * 1.25) alpha = 1.0 - dot(fragNorm, normalize(cameraPosition));
  else alpha = 1.0 - (pdist / camSpaceERadius);

  alpha *= brightFactor;

  vec3 color = vec3(0.6706, 0.8275, 0.9137);
  gl_FragColor = vec4(color, alpha);
}