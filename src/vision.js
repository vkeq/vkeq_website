import * as THREE from 'three';

// "Torch-light" vision: everything farther than a radius from the player fades into the
// dark, in a few hard steps so it keeps the pixel-art look. Implemented by replacing the
// fog chunk of every built-in material with a distance-to-player check.

export const vision = {
  center: { value: new THREE.Vector3() }, // player position in VIEW space (updated every frame)
  near: { value: 4.4 },
  far: { value: 6.8 },
  color: { value: new THREE.Color('#0b0814') },
};

const DECL = 'uniform vec3 uVisCenter; uniform float uVisNear; uniform float uVisFar; uniform vec3 uVisColor; varying vec3 vVisPos;\n';
const APPLY = `
  {
    float visD = length(vVisPos - uVisCenter);
    float vis = 1.0 - clamp((visD - uVisNear) / (uVisFar - uVisNear), 0.0, 1.0);
    vis = floor(vis * 4.0 + 0.5) / 4.0;
    gl_FragColor.rgb = mix(uVisColor, gl_FragColor.rgb, vis);
  }
`;

function patch(material) {
  if (material.userData.visionPatched || material.isShaderMaterial) return;
  material.userData.visionPatched = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uVisCenter = vision.center;
    shader.uniforms.uVisNear = vision.near;
    shader.uniforms.uVisFar = vision.far;
    shader.uniforms.uVisColor = vision.color;
    shader.vertexShader = 'varying vec3 vVisPos;\n' + shader.vertexShader.replace('#include <fog_vertex>', '#include <fog_vertex>\n  vVisPos = mvPosition.xyz;');
    shader.fragmentShader = DECL + shader.fragmentShader.replace('#include <fog_fragment>', '#include <fog_fragment>\n' + APPLY);
  };
  material.customProgramCacheKey = () => 'vision';
  material.needsUpdate = true;
}

// Patch a single material (for objects added to the scene later).
export function visionMaterial(m) {
  patch(m);
  return m;
}

// Patch every material currently in the scene (call again after adding objects).
export function applyVision(scene) {
  scene.traverse((o) => {
    if (!o.material) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(patch);
  });
}

// Same effect for custom ShaderMaterials: add these to the shader by hand.
export const visionGLSL = { decl: DECL, apply: APPLY };

const tmp = new THREE.Vector3();
export function updateVision(camera, playerPos) {
  tmp.set(playerPos.x, 0.7, playerPos.z).applyMatrix4(camera.matrixWorldInverse);
  vision.center.value.copy(tmp);
}
