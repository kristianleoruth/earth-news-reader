varying mat4 mvMat;
varying mat4 pMat;
varying vec3 pos;

void main() {
  pos = position;
  pMat = projectionMatrix;
  mvMat = modelViewMatrix;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}