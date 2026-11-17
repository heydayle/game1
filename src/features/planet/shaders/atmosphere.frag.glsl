precision highp float;

uniform vec3 uSunDirection;
uniform vec3 uCameraPosition;
uniform vec3 uAtmosphereColor;

varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPosition - vWorldPosition);
  vec3 L = normalize(uSunDirection);

  // Fresnel rim glow
  float NdotV = max(dot(N, V), 0.0);
  float fresnel = pow(1.0 - NdotV, 3.2);

  // Atmosphere is illuminated primarily on the sunward limb
  float NdotL = dot(N, L);
  float sunFactor = smoothstep(-0.3, 0.4, NdotL);

  // Intensity diminishes on the dark side of the planet
  float intensity = fresnel * (sunFactor * 0.85 + 0.15);

  vec3 color = uAtmosphereColor * intensity;

  gl_FragColor = vec4(color, intensity);
}

