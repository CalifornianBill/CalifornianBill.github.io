// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'attribute vec3 a_Normal;\n' +

  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +
  'uniform mat3 u_NormalMatrix;\n' +
  'uniform vec3 u_LightPosition;\n' +

  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec3 v_NormalDir;\n' +
  'varying vec3 v_LightDir;\n' +
  'varying vec3 v_FragPos;\n' +

  'void main() {\n' +
  '  vec4 worldPosition = u_ModelMatrix * a_Position;\n' +
  '  gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPosition;\n' +

  '  v_Color = a_Color;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '  v_NormalDir = normalize(u_NormalMatrix * a_Normal);\n' +
  '  v_LightDir = normalize(u_LightPosition - vec3(worldPosition));\n' +
  '  v_FragPos = vec3(worldPosition);\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +

  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec3 v_NormalDir;\n' +
  'varying vec3 v_LightDir;\n' +
  'varying vec3 v_FragPos;\n' +

  'uniform sampler2D u_Sampler0;\n' +
  'uniform sampler2D u_Sampler1;\n' +
  'uniform bool u_UseTexture;\n' +
  'uniform int u_TextureIndex;\n' +
  'uniform bool u_ShowNormal;\n' +
  'uniform bool u_EnableLighting;\n' +
  'uniform bool u_IsSpotlight;\n' +

  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_ViewPosition;\n' +
  'uniform vec3 u_SpotlightPosition;\n' +
  'uniform vec3 u_SpotlightDirection;\n' +
  'uniform float u_SpotlightCutoff;\n' +
  'uniform float u_SpotlightOuterCutoff;\n' +

  'void main() {\n' +
  '  if (u_ShowNormal) {\n' +
  '    gl_FragColor = vec4(normalize(v_NormalDir) * 0.5 + 0.5, 1.0);\n' +
  '    return;\n' +
  '  }\n' +

  '  vec4 baseColor = u_UseTexture\n' +
  '    ? ((u_TextureIndex == 0) ? texture2D(u_Sampler0, v_TexCoord) : texture2D(u_Sampler1, v_TexCoord))\n' +
  '    : v_Color;\n' +

  '  if (!u_EnableLighting) {\n' +
  '    gl_FragColor = baseColor;\n' +
  '    return;\n' +
  '  }\n' +

  '  vec3 norm = normalize(v_NormalDir);\n' +
  '  vec3 lightDir = normalize(v_LightDir);\n' +
  '  vec3 viewDir = normalize(u_ViewPosition - v_FragPos);\n' +
  '  vec3 reflectDir = reflect(-lightDir, norm);\n' +

  '  float ambientStrength = 0.4;\n' +
  '  vec3 ambient = ambientStrength * u_LightColor;\n' +

  '  float diff = max(dot(norm, lightDir), 0.0);\n' +
  '  vec3 diffuse = diff * u_LightColor;\n' +

  '  float specularStrength = 0.1;\n' +
  '  float shininess = 32.0;\n' +
  '  float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);\n' +
  '  vec3 specular = specularStrength * spec * u_LightColor;\n' +

  '  if (u_IsSpotlight) {\n' +
  '    float theta = dot(normalize(-u_SpotlightDirection), lightDir);\n' +
  '    float epsilon = u_SpotlightCutoff - u_SpotlightOuterCutoff;\n' +
  '    float intensity = clamp((theta - u_SpotlightOuterCutoff) / epsilon, 0.0, 1.0);\n' +
  '    diffuse *= intensity;\n' +
  '    specular *= intensity;\n' +
  '  }\n' +
  '  vec3 lighting = ambient + diffuse + specular;\n' +
  '  gl_FragColor = vec4(baseColor.rgb * lighting, baseColor.a);\n' +
  '}\n';

var gl;
var canvas;
var a_Position;
var a_Color;
var a_TexCoord;
var u_Sampler0;
var u_Sampler1;
var u_ModelMatrix;
var u_GlobalRotation;
var u_ProjectionMatrix;
var u_ViewMatrix;
var y_lightColor;
var u_EnableLighting;
var cubeList = [];
var camera = null;
var texture0;
var texture1;
var showNormal = false;
var isRotating = true;
var lightPos = [0,0,0]
var isColor = false;
var isLit = true;
var WALK_ANIMATION = 0; // Animation variable for walking
var HEAD_ROTATION_SIDE = 0; // Animation variable for head rotation
var MOUTH = 0; // Animation variable for mouth movement
var isSpotlight = false;

// Performance variables
const fpsLimit = 144; // Set the maximum FPS
const frameTime = 1000 / fpsLimit; // Time per frame for the desired FPS

let lastTime = 0;
let frameCount = 0;
let fps = 0;
let deltaSum = 0;

// Mouse Dragging variableslet isDragging = false;
let isMouseDown = false;
let lastX = 0;
let lastY = 0;

let yaw = 0;   // horizontal angle (in degrees)
let pitch = 0; // vertical angle (in degrees)
const sensitivity = 0.1;
const radius = 0.1; // distance from eye to at

let lastRenderTime = 0;
const renderInterval = 4; // milliseconds (~60fps)

const hueSlider = document.getElementById('lightColor');

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  // Set u_GlobalRotation to Identity
  let identityRotation = new Matrix4();
  identityRotation.setIdentity();

  // Setup Camera
  camera = new Camera(canvas);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // Enable depth testing
  gl.enable(gl.DEPTH_TEST);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  initTextures(gl); // Initialize textures
  initBuffers(gl); // Initialize buffers

  populateCubeList();

  // Set initial color
  gl.uniform3fv(u_LightColor, [1.0, 1.0, 1.0]); // Default to white light
  gl.uniform1i(u_EnableLighting, true); // or false to disable lighting

  // Choose between point light and spotlight
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_IsSpotlight'), false); // or false
  gl.uniform1f(gl.getUniformLocation(gl.program, 'u_SpotlightCutoff'), Math.cos(5 * Math.PI / 180)); // in degrees
  gl.uniform1f(gl.getUniformLocation(gl.program, 'u_SpotlightOuterCutoff'), Math.cos(10 * Math.PI / 180)); // soft edge
  gl.uniform3fv(gl.getUniformLocation(gl.program, 'u_SpotlightDirection'), [0.0, -1.0, 0.0]);

  camera.updateViewMatrix(); // Ensure matrix is initialized
  renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);

  requestAnimationFrame(tick);

  attachEventListeners(); // Attach event listeners for sliders and buttons
}

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST)
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_UseTexture = gl.getUniformLocation(gl.program, 'u_UseTexture');
  if (!u_UseTexture) {
    console.log('Failed to get the storage location of u_UseTexture');
    return;
  }

  u_TextureIndex = gl.getUniformLocation(gl.program, 'u_TextureIndex');
  if (!u_TextureIndex) {
    console.log('Failed to get the storage location of u_TextureIndex');
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (!a_Normal) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }

  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  if (!u_LightColor) {
    console.log('Failed to get the storage location of u_LightColor');
    return;
  }

  u_EnableLighting = gl.getUniformLocation(gl.program, 'u_EnableLighting');
  if (!u_EnableLighting) {
    console.log('Failed to get the storage location of u_EnableLighting');
    return;
  }
}

function attachEventListeners() {  
  document.addEventListener('keydown', function(event) {
  const speed = 0.5;      // Movement speed
  const angle = 5;        // Rotation angle in degrees

  switch (event.key) {
    case 'w':
    case 'W':
      camera.moveForward(speed);
      renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
      break;
    case 's':
    case 'S':
      camera.moveBackwards(speed);
      renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
      break;
    case 'a':
    case 'A':
      camera.moveLeft(speed);
      renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
      break;
    case 'd':
    case 'D':
      camera.moveRight(speed);
      renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
      break;
    case 'q':
    case 'Q':
      camera.panLeft(angle);
      renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
      break;
    case 'e':
    case 'E':
      camera.panRight(angle);
      renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
      break;
  }

  canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  
  canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  canvas.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;

  const now = performance.now();
  if (now - lastRenderTime < renderInterval) return;
  lastRenderTime = now;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;

  yaw += dx * sensitivity;
  pitch -= dy * sensitivity;

  if (pitch > 89) pitch = 89;
  if (pitch < -89) pitch = -89;

  updateCamera(camera, yaw, pitch, radius);
  //renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
});

hueSlider.addEventListener('input', () => {
  if (isColor) {
    const rgb = hueToRGB(parseFloat(hueSlider.value));
    gl.uniform3fv(u_LightColor, rgb);
    //renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
  }
});

});
}

function clearCanvas() {
  // Specify the color for clearing <canvas>
  gl.clearColor(0.8, 0.8, 1.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function populateCubeList(grid) {
  // Clear the cube list
  clearCubeList(cubeList);

  const white = new Float32Array(24 * 4).fill(1.0);

  const darkGray = new Float32Array([
    0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0, // Front face
    0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0, // Back face
    0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0, // Left face
    0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0, // Right face
    0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0, // Top face
    0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0,  0.1, 0.1, 0.1, 1.0  // Bottom face
  ]);

  const skyboxBlue = new Float32Array([
    // Front face
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    // Back face
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    // Top face
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    // Bottom face
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    // Right face
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    // Left face
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0,
    0.204, 0.608, 0.922, 1.0
  ]);

  const groundGreen = new Float32Array([
    // Front face
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    // Back face
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    // Top face
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    // Bottom face
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    // Right face
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    // Left face
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0,
    0.345, 0.451, 0.184, 1.0
  ]);

  //Body
  var cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M = new Matrix4();
  M.setTranslate(0, 0, 0);
  M.scale(0.9/2, 0.6/2, 0.6/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Mane
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = new Float32Array([
    // Front face (0.95)
    0.95, 0.95, 0.95, 1.0,  0.95, 0.95, 0.95, 1.0,
    0.95, 0.95, 0.95, 1.0,  0.95, 0.95, 0.95, 1.0,

    // Back face (0.9)
    0.9, 0.9, 0.9, 1.0,  0.9, 0.9, 0.9, 1.0,
    0.9, 0.9, 0.9, 1.0,  0.9, 0.9, 0.9, 1.0,

    // Top face (0.85)
    0.85, 0.85, 0.85, 1.0,  0.85, 0.85, 0.85, 1.0,
    0.85, 0.85, 0.85, 1.0,  0.85, 0.85, 0.85, 1.0,

    // Bottom face (0.8)
    0.8, 0.8, 0.8, 1.0,  0.8, 0.8, 0.8, 1.0,
    0.8, 0.8, 0.8, 1.0,  0.8, 0.8, 0.8, 1.0,

    // Right face (0.75)
    0.75, 0.75, 0.75, 1.0,  0.75, 0.75, 0.75, 1.0,
    0.75, 0.75, 0.75, 1.0,  0.75, 0.75, 0.75, 1.0,

    // Left face (0.75, 0.25, 0.25)
    0.75, 0.25, 0.25, 1.0,  0.75, 0.25, 0.25, 1.0,
    0.75, 0.25, 0.25, 1.0,  0.75, 0.25, 0.25, 1.0
  ]);
  M = new Matrix4();
  M.setTranslate(-0.75/2, 0.05/2, 0);
  M.scale(0.6/2, 0.7/2, 0.8/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Head
  cube = new Cube(); // Create a cube 
  cube.useTexture = false;
  cube.colors = white;
  M1 = new Matrix4();
  // Rotate around the rear face
  M1.translate(-0.6, 0.025, 0);
  M1.rotate(HEAD_ROTATION_SIDE*45, 45, 0, 1);
  M1.translate(0.6, -0.025, 0);
  // Translate and scale
  M1.translate(-0.6, 0.025, 0);
  M1.scale(0.15, 0.3, 0.3);
  cube.matrix = M1; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Eyes
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = darkGray;
  M = new Matrix4();
  // Rotate around the rear face
  M.translate(-0.6, 0.025, 0);
  M.rotate(HEAD_ROTATION_SIDE*45, 45, 0, 1);
  M.translate(0.6, -0.025, 0);
  // Translate and scale
  M.translate(-1.31/2, 0.15/2, 0.15/2);
  M.scale(0.1/2, 0.1/2, 0.1/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list.
  
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = darkGray;
  M = new Matrix4();
  // Rotate around the rear face
  M.translate(-0.6, 0.025, 0);
  M.rotate(HEAD_ROTATION_SIDE*45, 45, 0, 1);
  M.translate(0.6, -0.025, 0);
  // Translate and scale
  M.translate(-1.31/2, 0.15/2, -0.15/2);
  M.scale(0.1/2, 0.1/2, 0.1/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Snout
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M3 = new Matrix4();
  // Rotate around the rear face
  M3.translate(-0.6, 0.025, 0);
  M3.rotate(HEAD_ROTATION_SIDE*45, 45, 0, 1);
  M3.translate(0.6, -0.025, 0);
  // Translate and scale
  M3.translate(-1.5/2, -0.0/2, 0);
  M3.scale(0.3/2, 0.2/2, 0.3/2);
  cube.matrix = M3; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list
  
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M = new Matrix4(M3);
  // Rotate around the rear face
  M.translate(0.3, -0.5, 0);
  M.rotate(MOUTH*45, 0, 0, 1);
  M.translate(-0.3, 0.5, 0);
  // Translate and scale
  M.translate(0, -0.75, 0);
  M.scale(1, 0.5, 1);

  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Nose
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = darkGray;
  M = new Matrix4();
  // Rotate around the rear face
  M.translate(-0.6, 0.025, 0);
  M.rotate(HEAD_ROTATION_SIDE*45, 45, 0, 1);
  M.translate(0.6, -0.025, 0);
  // Translate and scale
  M.translate(-1.61/2, 0.06/2, 0);
  M.scale(0.1/2, 0.1/2, 0.1/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Ears
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M = new Matrix4(M1);
  // Rotate
  M.translate(0, 0.65/2, 0.3); // Translate to the bottom of the cube
  M.rotate(WALK_ANIMATION * 10, 1, 0, 0); // Rotate around the Y-axis (side-to-side)
  M.translate(0, -0.65/2, -0.3); // Translate back
  // Translate and scale
  M.translate(0.65/2, 1.1/2, 0.65/2);
  M.scale((1/0.15) * (0.1/2), (1/0.3) * (0.3/2), (1/0.3) * (0.2/2));
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list
  
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M = new Matrix4(M1);
  // Rotate
  M.translate(0, 0.65/2, -0.3); // Translate to the bottom of the cube
  M.rotate(WALK_ANIMATION * 10, 1, 0, 0); // Rotate around the Y-axis (side-to-side)
  M.translate(0, -0.65/2, 0.3); // Translate back
  // Translate and scale
  M.translate(0.65/2, 1.1/2, -0.65/2);
  M.scale((1/0.15) * (0.1/2), (1/0.3) * (0.3/2), (1/0.3) * (0.2/2));
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Legs
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M = new Matrix4();
  // Rotate
  M.translate(-0.4, -0.15, 0.075);
  M.rotate(WALK_ANIMATION*45, 0, 0, 1);
  M.translate(0.4, 0.15, -0.075);
  //Translate and scale
  M.translate(-0.8/2, -0.6/2, 0.15/2);
  M.scale(0.2/2, 0.8/2, 0.2/2);
  cube.matrix = M;
  cubeList.push(cube);
  
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M = new Matrix4();
  // Rotate
  M.translate(0.125, -0.15, 0.075);
  M.rotate(WALK_ANIMATION*45, 0, 0, 1);
  M.translate(-0.125, 0.15, -0.075);
  // Translate and scale
  M.translate(0.125, -0.6/2, 0.075);
  M.scale(0.1, 0.8/2, 0.1);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list
  
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M = new Matrix4();
  // Rotate
  M.translate(-0.4, -0.15, 0.075); // Notice the opposites
  M.rotate(-WALK_ANIMATION*45, 0, 0, 1);
  M.translate(0.4, 0.15, -0.075);
  //Translate and scale
  M.translate(-0.8/2, -0.6/2, -0.15/2);
  M.scale(0.2/2, 0.8/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list
  
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M = new Matrix4();
  // Rotate
  M.translate(0.125, -0.15, 0.075);
  M.rotate(-WALK_ANIMATION*45, 0, 0, 1);
  M.translate(-0.125, 0.15, -0.075);
  // Translate and scale
  M.translate(0.25/2, -0.6/2, -0.15/2);
  M.scale(0.2/2, 0.8/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Tail
  cube = new Cube(); // Create a cube object
  cube.useTexture = false;
  cube.colors = white;
  M = new Matrix4();
  M.translate(0.65/2, -0.15/2, 0/2);
  M.rotate(45, 0, 0, 1);
  M.translate(-0.125, 0.15, 0);
  M.rotate(-WALK_ANIMATION*45, 1, 0, 0);
  M.translate(0.125, -0.15, 0); 
  M.scale(0.2/2, 1/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list
  
/* 
  // Ground cube
  var cube = new Cube();
  cube.colors = groundGreen;
  cube.useTexture = false;
  M = new Matrix4();
  M.translate(0, -1, 0);
  M.scale(32,0.5,32);
  cube.matrix = M;
  cubeList.push(cube);
  
  var cube = new Cube();
  cube.colors = groundGreen;
  cube.useTexture = true;
  M = new Matrix4();
  M.translate(0, -2, 0);
  M.scale(0.5,0.5,0.5);
  cube.matrix = M;
  cubeList.push(cube);

  var cube = new Cube();
  cube.colors = white;
  cube.useTexture = true;
  M = new Matrix4();
  M.translate(-1, 0, 0);
  M.scale(0.5,0.5,0.5);
  cube.matrix = M;
  cubeList.push(cube);

  var cube = new Cube();
  cube.colors = groundGreen;
  cube.useTexture = false;
  M = new Matrix4();
  M.translate(0, -2, 0);
  M.scale(0.5,0.5,0.5);
  cube.matrix = M;
  cubeList.push(cube);

  // Skybox cube
  var cube = new Cube();
  cube.colors = skyboxBlue;
  cube.useTexture = false;
  M = new Matrix4();
  M.translate(0, 0, 0);
  M.scale(1000,1000,1000);
  cube.matrix = M;
  cubeList.push(cube);*/

  var cube = new Cube();
  cube.colors = white;
  cube.useTexture = true;
  M = new Matrix4();
  M.translate(-1.5, 0, 0);
  M.scale(0.5,0.5,0.5);
  cube.matrix = M;
  cubeList.push(cube);
}

function renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix) {
  clearCanvas(gl);
  
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  
  let modelMatrix = new Matrix4();
  modelMatrix.setTranslate(1, 0, 0);
  modelMatrix.scale(0.3, 0.3, 0.3);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform1i(u_UseTexture, 0);

  drawSphere(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix);

  var cubeL = new Cube();
  cubeL.useTexture = true;
  M = new Matrix4();
  M.setTranslate(lightPos[0], lightPos[1], lightPos[2]);
  M.scale(0.5,0.5,0.5);
  cubeL.matrix = M;

  drawCube(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeL);

  gl.uniform1i(u_UseTexture, 1);

  for (var i = 0; i < cubeList.length; i++) {
      drawCube(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList[i]);
  }

}

function tick() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;

  frameCount++;
  deltaSum += deltaTime;
  if (deltaSum >= 1000) {
    fps = frameCount;
    frameCount = 0;
    deltaSum = 0;
    lastTime = currentTime;
    updateFPSText(fps);
  }
  frameCount++;

  const radius = 3.0;
  if (!isSpotlight) {
    lightPos[1] = 0;
    var time = 0;
    if(isRotating) {
      time = performance.now() * 0.001; // seconds
    } else {
      var rot = document.getElementById('lightRotation').value;
      time = rot * 2 * Math.PI;
    }
    lightPos[0] = Math.cos(time) * radius;
    lightPos[2] = Math.sin(time) * radius;
  }
  else {
    lightPos[1] = 2;
    lightPos[2] = 0;
    if(isRotating) {
      time = performance.now() * 0.001; // seconds
    } else {
      var rot = document.getElementById('lightRotation').value;
      time = rot * 2 * Math.PI;
    }
    lightPos[0] = Math.sin(time/2) * radius;
  }

  gl.uniform3fv(gl.getUniformLocation(gl.program, 'u_LightPosition'), lightPos);
  gl.uniform3fv(gl.getUniformLocation(gl.program, 'u_SpotlightPosition'), lightPos);

  if (deltaTime >= frameTime) {
    lastTime = currentTime;

    //camera.updateViewMatrix();
    renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
  }

  requestAnimationFrame(tick);
}

function updateFPSText(fps) {
  const fpsElement = document.getElementById('fpsCounter');
  fpsElement.textContent = `FPS: ${fps.toFixed(1)}`;
}

function updateCamera(camera, yawDeg, pitchDeg, distance) {
  const yaw = yawDeg * Math.PI / 180;
  const pitch = pitchDeg * Math.PI / 180;

  const x = distance * Math.cos(pitch) * Math.sin(yaw);
  const y = distance * Math.sin(pitch);
  const z = distance * Math.cos(pitch) * Math.cos(yaw);

  var a = [x + camera.at.elements[0], y + camera.at.elements[1], z + camera.at.elements[2]];
  camera.eye.elements[0] = x + camera.at.elements[0];
  camera.eye.elements[1] = y + camera.at.elements[1];
  camera.eye.elements[2] = z + camera.at.elements[2];
  camera.updateViewMatrix();
}

function showNormals() {
  if(!showNormal) {
    showNormal = true;
  } else {
    showNormal = false;
  }
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_ShowNormal'), showNormal);
  renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
}

function toggleRotation() {
  if(isRotating) {
    isRotating = false;
  } else {
    isRotating = true;
  }
}

function hueToRGB(h) {
  let c = 1, x = 1 - Math.abs((h / 60) % 2 - 1), m = 0;
  let r, g, b;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [r + m, g + m, b + m];
}

function toggleColor() {
  if(isColor) {
    isColor = false;
    gl.uniform3fv(u_LightColor, [1.0, 1.0, 1.0]); // Reset to white light
  } else {
    isColor = true;
    gl.uniform3fv(u_LightColor, hueToRGB(hueSlider.value));
  }
}

function toggleLighting() {
  if (isLit) {
    isLit = false;
    gl.uniform1i(u_EnableLighting, false);
  } else {
    isLit = true;
    gl.uniform1i(u_EnableLighting, true);
  }
  renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
}

function toggleLightType() {
  if (isSpotlight) {
    isSpotlight = false;
    gl.uniform1i(gl.getUniformLocation(gl.program, 'u_IsSpotlight'), false);
  } else {
    isSpotlight = true;
    gl.uniform1i(gl.getUniformLocation(gl.program, 'u_IsSpotlight'), true);
  }
  renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
}