varying vec2 vUv;

void main() {
  float offset = -1.0;
  vec3 newPosition = position;
  newPosition.z = newPosition.z - offset;
  
  gl_Position = vec4(newPosition, 1.0);
  
  // Varyings
  vUv = uv;
}