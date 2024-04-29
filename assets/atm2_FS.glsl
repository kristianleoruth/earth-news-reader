uniform float radius;

varying mat4 modelViewMat;
varying vec3 pos;
varying vec3 fragNorm;

float distNormalizer;

float camSpaceDist(vec3 p1, vec3 p2) {
  vec2 p1cam = (modelViewMat * vec4(p1, 1.0)).xy;
  vec2 p2cam = (modelViewMat * vec4(p2, 1.0)).xy;
  return distance(p1cam, p2cam) / distNormalizer;
}

void main() {
  distNormalizer = distance(cameraPosition, vec3(0.0));
  vec3 color = vec3(0.2706, 0.7333, 1.0);

  // vec3 camRight = vec3(modelViewMat[0][0], modelViewMat[1][0], modelViewMat[2][0]);

  // float referenceUnitLength = camSpaceDist(camRight, vec3(0.0));
  float alpha;
  // float camSpaceERadius = referenceUnitLength * radius;

  // float pdist = camSpaceDist(pos, vec3(0.0));
  // alpha = pdist / radius;

  float alphaScaleFactor = 0.3;

  alpha = (1.0 - dot(fragNorm, normalize(cameraPosition))) * alphaScaleFactor;

  gl_FragColor = vec4(color.xyz, alpha);
}