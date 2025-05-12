// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +  // Added color attribute
  'attribute vec2 a_TexCoord;\n' + // Added texture coordinate attribute
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +
  'varying vec4 v_Color;\n' +  // Passing color to fragment shader
  'varying vec2 v_TexCoord;\n' + // Passing texture coordinates to fragment shader
  'void main() {\n' +
  '   gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '   v_Color = a_Color;\n' +  // Pass color to fragment shader
  '   v_TexCoord = a_TexCoord;\n' + // Pass texture coordinates to fragment shader
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'uniform sampler2D u_Sampler0;\n' +
  'uniform sampler2D u_Sampler1;\n' +
  'uniform bool u_UseTexture;\n' +
  'uniform int u_TextureIndex;\n' +
  'void main() {\n' +
  '  if (u_UseTexture) {\n' +
  '    vec4 texColor = (u_TextureIndex == 0) ? texture2D(u_Sampler0, v_TexCoord) : texture2D(u_Sampler1, v_TexCoord);\n' +
  '    gl_FragColor = texColor * v_Color;\n' +
  '  } else {\n' +
  '    gl_FragColor = v_Color;\n' +
  '  }\n' +
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
var cubeList = [];
var camera = null;
var texture0;
var texture1;

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

var defGrid = [
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,4,4,4,4,4,4,4,4,2,2,1,1,0,0,3,2,0,3,2,2,1,0,0,0,0,0,0],
[0,0,0,0,0,4,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,2,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0],
[0,0,0,0,0,3,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,3,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
[0,0,0,0,0,3,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0],
[0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0],
[0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0],
[0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,4,0,0,0],
[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,3,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,1,0,0,0],
[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,3,0,0,0],
[0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0],
[0,0,0,0,0,3,2,0,0,0,0,1,2,2,3,3,3,0,0,1,2,4,4,4,4,4,4,4,4,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

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

  populateCubeList(defGrid);

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
    case 'r':
    case 'R':
      placeBlock();
      renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
      break;
    case 'f':
    case 'F':
      removeBlock();
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
  renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
});

});
}

function clearCanvas() {
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function updateRotationAngle() {
  var xSlider = document.getElementById('xSlider');
  var xSliderValue = xSlider.value; // get current slider value
  var ySlider = document.getElementById('ySlider');
  var ySliderValue = ySlider.value; // get current slider value

  // Combine the slider values and mouse-dragged angles
  var finalXAngle = (xSliderValue + xAngle) % 360; // Combine slider value with mouse-controlled angle
  var finalYAngle = (ySliderValue - yAngle) % 360; // Combine slider value with mouse-controlled angle

  // Create the rotation matrix
  var rotationMatrix = new Matrix4();
  rotationMatrix.setIdentity(); // Start with identity matrix
  rotationMatrix.rotate(-finalXAngle, 1, 0, 0); // Rotate around X axis
  rotationMatrix.rotate(finalYAngle, 0, 1, 0); // Rotate around Y axis

  gl.uniformMatrix4fv(u_GlobalRotation, false, rotationMatrix.elements);
}

function populateCubeList(grid) {
  // Clear the cube list
  clearCubeList(cubeList);

  const white = new Float32Array(24 * 4).fill(1.0);

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

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] > 0) {
        const cube = new Cube();
        cube.colors = white;
        cube.useTexture = true;
        cube.textureIndex = Math.random() < 0.5 ? 0 : 1;
        M = new Matrix4();
        M.translate((i - 16) * 0.5, -0.5, (j - 16) * 0.5);
        M.scale(0.5, 0.5, 0.5);
        cube.matrix = M;
        cubeList.push(cube);
      }
      if (grid[i][j] > 1) {
        const cube = new Cube();
        cube.colors = white;
        cube.useTexture = true;
        cube.textureIndex = Math.random() < 0.5 ? 0 : 1;
        M = new Matrix4();
        M.translate((i - 16) * 0.5, 0, (j - 16) * 0.5);
        M.scale(0.5, 0.5, 0.5);
        cube.matrix = M;
        cubeList.push(cube);
      }
      if (grid[i][j] > 2) {
        const cube = new Cube();
        cube.colors = white;
        cube.useTexture = true;
        cube.textureIndex = Math.random() < 0.5 ? 0 : 1;
        M = new Matrix4();
        M.translate((i - 16) * 0.5, 0.5, (j - 16) * 0.5);
        M.scale(0.5, 0.5, 0.5);
        cube.matrix = M;
        cubeList.push(cube);
      }
      if (grid[i][j] > 3) {
        const cube = new Cube();
        cube.colors = white;
        cube.useTexture = true;
        cube.textureIndex = Math.random() < 0.5 ? 0 : 1;
        M = new Matrix4();
        M.translate((i - 16) * 0.5, 1, (j - 16) * 0.5);
        M.scale(0.5, 0.5, 0.5);
        cube.matrix = M;
        cubeList.push(cube);
      }
    }
  }

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
  cubeList.push(cube);
}

function renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix) {
  clearCanvas(gl);
  
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  
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

  if (deltaTime >= frameTime) {
    lastTime = currentTime;

    //camera.updateViewMatrix();
    //renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
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

function submitGrid() {
  const largeTextbox = document.getElementById('largeTextbox');
  const text = largeTextbox.value;
  var newGrid = Array.from({ length: 32 }, () =>
    Array.from({ length: 32 }, () => 0)
  );
  text.split('\n').forEach((line, row) => {
    line.split(',').forEach((value, col) => {
      if (row < 0 || row > 32 || col < 0 || col > 32) {
        console.log(`Invalid index: row ${row}, col ${col}`);
        return;
      }
      else {
        newGrid[row][col] = parseInt(value);
      }
    });
  });

  populateCubeList(newGrid);
  renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
}

function placeBlock() {
  i = Math.round((camera.eye.elements[0]/0.5) + 16);
  j = Math.round((camera.eye.elements[2]/0.5) + 16);

  if ((i > 0 || i < 32 || j > 0 || j < 32) && defGrid[i][j] <= 4) {
    defGrid[i][j] = defGrid[i][j] + 1;
  }
  
  populateCubeList(defGrid);
  renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
}

function removeBlock() {
  i = Math.round((camera.eye.elements[0]/0.5) + 16);
  j = Math.round((camera.eye.elements[2]/0.5) + 16);

  if ((i > 0 || i < 32 || j > 0 || j < 32) && defGrid[i][j] > 0) {
    defGrid[i][j] = defGrid[i][j] - 1;
  }
  
  populateCubeList(defGrid);
  renderScene(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cubeList, camera, u_ProjectionMatrix, u_ViewMatrix);
}
