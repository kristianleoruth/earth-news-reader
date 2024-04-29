varying mat4 modelViewMat;
varying vec3 pos;
varying vec3 fragNorm;

void main() {
  fragNorm = normal;
  modelViewMat = modelViewMatrix;
  pos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}