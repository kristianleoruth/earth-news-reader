uniform vec3 sunOrigin;

varying mat4 pMat;
varying mat4 mvMat;
varying vec3 pos;

float distNormalizer;

float camSpaceDist(vec3 p1, vec3 p2) {
  vec2 p1cam = (pMat * mvMat * vec4(p1, 1.0)).xy;
  vec2 p2cam = (pMat * mvMat * vec4(p2, 1.0)).xy;
  return distance(p1cam, p2cam) / distNormalizer;
}

void main() {
  distNormalizer = distance(cameraPosition, sunOrigin);
  float dist = camSpaceDist(pos, sunOrigin);
  vec3 camRight = vec3(mvMat[0][0], mvMat[1][0], mvMat[2][0]);
  float refUnit = camSpaceDist(camRight, vec3(0.0));
  // float alpha = 1.0 - dist / (refUnit * 8.0);
  // float alpha = dist;
  gl_FragColor = vec4(1.0, 0.9725, 0.902, 1.0);
}