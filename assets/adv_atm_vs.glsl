varying vec3 fragNorm;
varying vec3 pos;
varying mat4 modelViewMat;
varying mat4 projMat;

uniform float atmradius;

void main() {
  modelViewMat = modelViewMatrix;
  projMat = projectionMatrix;
  pos = position;
  fragNorm = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(normalize(position) * atmradius, 1.0);
}