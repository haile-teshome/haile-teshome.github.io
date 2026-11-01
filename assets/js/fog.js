/* Rolling fog over the side-banner photo.
   A domain-warped fractal noise field drifts slowly sideways; it is
   masked to the photo's fog band and composited as a soft, semi-
   transparent white layer. Rendered at reduced resolution, paused
   when hidden, and a single still frame under reduced motion. */
(function () {
  const side = document.querySelector('.side');
  const img = side && side.querySelector('.side-img');
  if (!side || !img) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'side-fog';
  canvas.setAttribute('aria-hidden', 'true');
  img.insertAdjacentElement('afterend', canvas);
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
  if (!gl) { canvas.remove(); return; }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCALE = 0.5;   // render at half resolution — fog is soft anyway

  const VS = 'attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';
  const FS = `
    precision mediump float;
    varying vec2 uv;
    uniform float t;
    uniform float dens;   // fog thickness (weather-driven)
    uniform float bright; // fog brightness (dimmer at night)
    uniform vec2 res;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
      return v;
    }
    void main(){
      vec2 q = vec2(uv.x * res.x / res.y, 1.0 - uv.y);          // x scaled by aspect; y = 0 at top
      vec2 p = vec2(q.x * 2.2, q.y * 4.2);
      vec2 w = vec2(fbm(p + vec2(t * 0.05, 0.0)), fbm(p + vec2(5.2, 1.3) - vec2(t * 0.03, 0.0)));
      float f = fbm(p + 1.6 * w + vec2(t * 0.09, 0.0));
      f = smoothstep(0.36, 0.78, f);
      // the photo's fog sits between the skyline and the bridge deck; a thinner veil lower down
      float band = smoothstep(0.17, 0.30, q.y) * (1.0 - smoothstep(0.50, 0.68, q.y));
      float low  = smoothstep(0.55, 0.70, q.y) * (1.0 - smoothstep(0.78, 0.95, q.y)) * 0.45;
      float a = min(f * (band + low) * 0.85 * dens, 0.92);
      gl_FragColor = vec4(vec3(0.95, 0.95, 0.94) * bright * a, a);
    }`;
  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { canvas.remove(); return; }
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(prog, 't'), uRes = gl.getUniformLocation(prog, 'res');
  const uDens = gl.getUniformLocation(prog, 'dens'), uBright = gl.getUniformLocation(prog, 'bright');
  // weather.js may update these; defaults match a typical foggy afternoon
  const fog = window.__fog = window.__fog || { density: 1, speed: 1, bright: 1 };
  fog.redraw = () => draw();

  function resize() {
    const w = side.clientWidth, h = side.clientHeight;
    canvas.width = Math.max(1, Math.round(w * SCALE)); canvas.height = Math.max(1, Math.round(h * SCALE));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, w, h);
  }
  let t = 12, last = performance.now(), raf = null;
  function draw() { gl.uniform1f(uT, t); gl.uniform1f(uDens, fog.density); gl.uniform1f(uBright, fog.bright); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
  function frame(now) { t += Math.min((now - last) / 1000, 0.05) * fog.speed; last = now; draw(); raf = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', () => {
    if (reduce) return;
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); draw(); }, 120); });
  resize();
  if (reduce) draw(); else raf = requestAnimationFrame(frame);
})();
