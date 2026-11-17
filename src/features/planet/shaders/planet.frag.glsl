precision highp float;

uniform vec3 uSunDirection;
uniform float uOceanLevel;
uniform float uIceCapLatitude;
uniform float uSeed;
uniform vec3 uCameraPosition;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

// --- Simplex 3D Noise (Ashima / McEwan) ---
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  // Permutations
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  float n_ = 0.142857142857; // 1.0/7.0
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); // mod(p, N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_); // mod(j, N)

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix contributions from the four corners
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Fractal Brownian Motion (5 octaves)
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 5; i++) {
    value += amplitude * (snoise(p * frequency) * 0.5 + 0.5);
    frequency *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec3 normPos = normalize(vPosition);
  float latitude = abs(normPos.y);

  // Seed offset
  vec3 seedOffset = vec3(uSeed * 17.3, uSeed * 31.7, uSeed * 47.1);

  // Domain warping for natural continental shapes
  vec3 p = normPos * 1.8 + seedOffset;
  float q1 = fbm(p + vec3(0.0, 1.2, 3.4));
  float q2 = fbm(p + vec3(4.3, 2.1, 0.8));
  vec3 warpedP = p + vec3(q1, q2, q1 * 0.5) * 0.55;

  float elevation = fbm(warpedP);

  // Earth-tone color palette
  vec3 deepOcean    = vec3(0.035, 0.118, 0.224);
  vec3 shallowOcean = vec3(0.086, 0.278, 0.388);
  vec3 beach        = vec3(0.725, 0.655, 0.498);
  vec3 lowland      = vec3(0.227, 0.388, 0.243);
  vec3 highland     = vec3(0.149, 0.278, 0.176);
  vec3 mountain     = vec3(0.353, 0.322, 0.294);
  vec3 mountainSnow = vec3(0.820, 0.855, 0.882);
  vec3 polarIce     = vec3(0.878, 0.918, 0.941);

  vec3 surfaceColor = deepOcean;
  float oceanMask = 0.0;

  // Water vs Land
  if (elevation < uOceanLevel) {
    float tWater = smoothstep(uOceanLevel - 0.15, uOceanLevel, elevation);
    surfaceColor = mix(deepOcean, shallowOcean, tWater);
    oceanMask = 1.0;
  } else {
    float tLand = elevation - uOceanLevel;
    if (tLand < 0.04) {
      // Beach
      surfaceColor = mix(beach, lowland, tLand / 0.04);
    } else if (tLand < 0.22) {
      // Plains to Forest
      surfaceColor = mix(lowland, highland, (tLand - 0.04) / 0.18);
    } else if (tLand < 0.36) {
      // Mountain rock
      surfaceColor = mix(highland, mountain, (tLand - 0.22) / 0.14);
    } else {
      // Mountain snow
      surfaceColor = mix(mountain, mountainSnow, clamp((tLand - 0.36) / 0.12, 0.0, 1.0));
    }
  }

  // Polar ice caps (modulated by noise for irregular edges)
  float iceNoise = snoise(normPos * 6.0) * 0.06;
  float iceThreshold = uIceCapLatitude + iceNoise;
  if (latitude > iceThreshold) {
    float iceBlend = smoothstep(iceThreshold, iceThreshold + 0.08, latitude);
    surfaceColor = mix(surfaceColor, polarIce, iceBlend * 0.95);
    oceanMask *= (1.0 - iceBlend);
  }

  // Lighting
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uSunDirection);
  vec3 V = normalize(uCameraPosition - vWorldPosition);

  // Soft half-lambert diffuse
  float NdotL = dot(N, L);
  float diffuse = smoothstep(-0.15, 0.4, NdotL);

  // Ocean specular reflection (glossy water, matte land)
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 32.0) * oceanMask * 0.45 * diffuse;

  // Space ambient light
  vec3 ambient = vec3(0.04, 0.05, 0.08) * surfaceColor;

  // Final color composition
  vec3 finalColor = surfaceColor * diffuse + vec3(spec) + ambient;

  gl_FragColor = vec4(finalColor, 1.0);
}

