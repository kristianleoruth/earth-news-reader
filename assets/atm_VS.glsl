varying vec3 fragNorm;
varying vec3 pos;
varying mat4 modelViewMat;
varying mat4 projMat;

void main() {
  modelViewMat = modelViewMatrix;
  projMat = projectionMatrix;
  pos = position;
  fragNorm = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}