varying vec2 vUv;

void main() {
  gl_FragColor = vec4(vUv.xy, 1., 1.0);
}