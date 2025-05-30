// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +  // Added color attribute
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotation;\n' +
  'varying vec4 v_Color;\n' +  // Passing color to fragment shader
  'void main() {\n' +
  '   gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;\n' +
  '   v_Color = a_Color;\n' +  // Pass color to fragment shader
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +  // Receive color from vertex shader
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +  // Set fragment color
  '}\n';

class Cube {
  constructor() {
    this.colors = [
      [1.0, 1.0, 1.0, 1.0], // white
      [1.0, 0.0, 0.0, 1.0], // red
      [0.0, 1.0, 0.0, 1.0], // green
      [0.0, 0.0, 1.0, 1.0], // blue
      [1.0, 1.0, 0.0, 1.0], // yellow
      [1.0, 0.0, 1.0, 1.0]  // magenta
    ];
    this.matrix = new Matrix4(); // identity matrix
  }
}

WALK_ANIMATION = 0; // Animation progress
HEAD_ROTATION_SIDE = 0; // Head rotation progress
EAR_WIGGLE = 0; // Ear wiggle progress
MOUTH = 0;

let lastTime = 0;
const fpsLimit = 144; // Set the maximum FPS
const frameTime = 1000 / fpsLimit; // Time per frame for the desired FPS

let frameCount = 0;
let fps = 0;
let deltaSum = 0;
let startTime = null; // Start time for animation
let startTime2 = null; // Start time for animation

var gl;
var canvas;
var a_Position;
var a_Color;
var u_ModelMatrix;
var u_GlobalRotation;
var cubeList = [];

let direction = 1;
let isWalkAnim = false;
let isDrawPyramid = false;
let isBarking = false;
let isAnimating = false;
let _prevAnim = 0;

let isDragging = false; // Flag to check if the mouse is being dragged
let lastX = 0; // Last X position of the mouse
let lastY = 0; // Last Y position of the mouse

let xAngle = 720; // Initial X angle
let yAngle = 720; // Initial Y angle

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  // Set u_GlobalRotation to Identity
  let identityRotation = new Matrix4();
  identityRotation.setIdentity();

  // Pass it to shader
  gl.uniformMatrix4fv(u_GlobalRotation, false, identityRotation.elements);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // Enable depth testing
  gl.enable(gl.DEPTH_TEST);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  populateCubeList();

  if(isDrawPyramid) {
    drawPyramid(); // Draw the pyramid
  }

  requestAnimationFrame(tick);

  // Attach slider event listener
  document.getElementById('xSlider').addEventListener('input', function() {
    updateRotationAngle();
    clearCanvas();
    renderScene();
  });

  document.getElementById('ySlider').addEventListener('input', function() {
    updateRotationAngle();
    clearCanvas();
    renderScene();
  });

  document.getElementById('walk').addEventListener('input', function() {
    WALK_ANIMATION = document.getElementById('walk').value; // get current slider value
    populateCubeList();
    clearCanvas();
    renderScene();
  });

  document.getElementById('headSide').addEventListener('input', function() {
    HEAD_ROTATION_SIDE = document.getElementById('headSide').value; // get current slider value
    populateCubeList();
    clearCanvas();
    renderScene();
  });

  document.getElementById('mouth').addEventListener('input', function() {
    MOUTH = document.getElementById('mouth').value; // get current slider value
    populateCubeList();
    clearCanvas();
    renderScene();
  });

  const button = document.getElementById('walkAnimButton');
  button.addEventListener('click', () => {
      isWalkAnim = !isWalkAnim;
  });

  const button2 = document.getElementById('pyramidButton');
  button2.addEventListener('click', () => {
    isDrawPyramid = !isDrawPyramid;
    renderScene();
  });

  canvas.addEventListener('click', function(mouseEvent) {
    if (mouseEvent.shiftKey) {
      isBarking = true;
    }
  });

  // Add event listeners for mouse interactions
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;  // Start dragging
    lastX = e.clientX;  // Store the mouse's initial X position
    lastY = e.clientY;  // Store the mouse's initial Y position
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return; // Only rotate when dragging
    
    const deltaX = e.clientX - lastX; // Calculate the horizontal movement
    const deltaY = e.clientY - lastY; // Calculate the vertical movement

    // Update angles based on the movement
    xAngle += deltaY * 0.2; // Adjust the sensitivity here
    yAngle += deltaX * 0.2; // Adjust the sensitivity here
    
    // Update the rotation matrix with the new angles, considering sliders
    updateRotationAngle();

    // Update the last mouse position for the next move
    lastX = e.clientX;
    lastY = e.clientY;
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false; // Stop dragging when mouse is released
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false; // Stop dragging if the mouse leaves the canvas
  });
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

  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  if (!u_GlobalRotation) {
    console.log('Failed to get the storage location of u_GlobalRotation');
    return;
  }
}

function clearCanvas() {
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function drawCube(gl, a_Position, a_Color, u_ModelMatrix, u_GlobalRotation, cube) {
  // 6 faces * 4 vertices each
  var vertices = new Float32Array([
    // Front face
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,

    // Back face
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,

    // Top face
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,

    // Bottom face
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,

    // Right face
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,

    // Left face
    -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,
  ]);

  // Colors per face (each face gets its color repeated 4 times)
  var colors = new Float32Array([
    ...cube.colors[0], ...cube.colors[0], ...cube.colors[0], ...cube.colors[0], // Front
    ...cube.colors[1], ...cube.colors[1], ...cube.colors[1], ...cube.colors[1], // Back
    ...cube.colors[2], ...cube.colors[2], ...cube.colors[2], ...cube.colors[2], // Top
    ...cube.colors[3], ...cube.colors[3], ...cube.colors[3], ...cube.colors[3], // Bottom
    ...cube.colors[4], ...cube.colors[4], ...cube.colors[4], ...cube.colors[4], // Right
    ...cube.colors[5], ...cube.colors[5], ...cube.colors[5], ...cube.colors[5], // Left
  ]);

  var indices = new Uint8Array([
    0, 1, 2,   2, 3, 0,    // front
    4, 5, 6,   6, 7, 4,    // back
    8, 9,10,  10,11, 8,    // top
   12,13,14,  14,15,12,    // bottom
   16,17,18,  18,19,16,    // right
   20,21,22,  22,23,20     // left
  ]);

  var n = indices.length;

  // Create buffers
  var vertexBuffer = gl.createBuffer();
  var colorBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();

  if (!vertexBuffer || !colorBuffer || !indexBuffer) {
    console.log('Failed to create buffers');
    return;
  }

  // Write vertex coordinates
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // Write colors
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Color);

  // Write indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  // Set matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, cube.matrix.elements);

  // Draw
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
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

function renderScene() {
  clearCanvas(gl);
  for (var i = 0; i < cubeList.length; i++) {
    drawCube(gl, a_Position, a_Color, u_ModelMatrix, u_GlobalRotation, cubeList[i]);
  }
  if(isDrawPyramid) {
    drawPyramid(); // Draw the pyramid
  }
}

function populateCubeList() {
  // Clear the cube list
  clearCubeList(cubeList);

  var white = [
    [0.95, 0.95, 0.95, 1.0], // light off-white
    [0.9, 0.9, 0.9, 1.0],    // medium off-white
    [0.85, 0.85, 0.85, 1.0], // darker off-white
    [0.8, 0.8, 0.8, 1.0],    // even darker off-white
    [0.75, 0.75, 0.75, 1.0], // darker still
    [0.7, 0.7, 0.7, 1.0]     // darkest off-white
  ];

  //Body
  var cube = new Cube(); // Create a cube object
  cube.colors = white;
  M = new Matrix4();
  M.setTranslate(0, 0, 0);
  M.scale(0.9/2, 0.6/2, 0.6/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Mane
  cube = new Cube(); // Create a cube object
  cube.colors = [
    [0.95, 0.95, 0.95, 1.0], // light off-white
    [0.9, 0.9, 0.9, 1.0],    // medium off-white
    [0.85, 0.85, 0.85, 1.0], // Top
    [0.8, 0.8, 0.8, 1.0],    // even darker off-white
    [0.75, 0.75, 0.75, 1.0], // Right
    [0.75, 0.25, 0.25, 1.0]  // Left
  ];
  M = new Matrix4();
  M.setTranslate(-0.75/2, 0.05/2, 0);
  M.scale(0.6/2, 0.7/2, 0.8/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Head
  cube = new Cube(); // Create a cube object
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
  cube.colors = [
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0]
  ];
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
  cube.colors = [
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0]
  ];
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
  cube.colors = [
    [0.95, 0.95, 0.95, 1.0], // light off-white
    [0.9, 0.9, 0.9, 1.0],    // medium off-white
    [0.85, 0.85, 0.85, 1.0], // darker off-white
    [0.85, 0.5, 0.5, 1.0],    // even darker off-white
    [0.75, 0.75, 0.75, 1.0], // darker still
    [0.7, 0.7, 0.7, 1.0]     // darkest off-white
  ];
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
  cube.colors = [
    [0.1, 0.1, 0.1, 1.0], // light off-white
    [0.1, 0.1, 0.1, 1.0],    // medium off-white
    [0.85, 0.5, 0.5, 1.0], // Top
    [0.8, 0.8, 0.8, 1.0],    // even darker off-white
    [0.75, 0.75, 0.75, 1.0], // Right
    [0.1, 0.1, 0.1, 1.0]  // Left
  ];
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
  cube.colors = [
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0],
    [0.1, 0.1, 0.1, 1.0]
  ];
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
}

function clearCubeList() {
  for (var i = 0; i < cubeList.length; i++) {
    cubeList[i] = null; // Clear the cube object
  }
  cubeList.length = 0; // Clear the array
}

function tick() {
  if (!startTime) {
    startTime = performance.now(); // Capture the start time if not set
  }

  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;

  frameCount++;
  deltaSum += deltaTime; // Accumulate delta time
  if (deltaSum >= 1000) { // Every second
    fps = frameCount; // Set FPS based on frame count in the last second
    frameCount = 0; // Reset frame count
    deltaSum = 0; // Reset delta time sum
    lastTime = currentTime; // Reset the last time
    updateFPSText(fps); // Update the on-screen FPS counter
  }

  updateAnimationAngles(deltaTime); // Update animation angles based on delta time

  // Only update and render if enough time has passed to maintain the FPS limit
  if (deltaTime >= frameTime) {
    lastTime = currentTime;

    renderScene();
  }

  requestAnimationFrame(tick);
}

function updateFPSText(fps) {
  const fpsElement = document.getElementById('fpsCounter');
  fpsElement.textContent = `FPS: ${fps.toFixed(1)}`;
}

function updateAnimationAngles(deltaTime) {
  if(isWalkAnim) {
    // Get elapsed time since startTime
    let elapsedTime = performance.now() - startTime;

    let duration = 1000;

    WALK_ANIMATION = Math.sin((elapsedTime / duration) * 2 * Math.PI);
    HEAD_ROTATION_SIDE = Math.sin((elapsedTime / duration) * 2 * Math.PI) / 45 * 10; // Rotate head side to side
    populateCubeList(); // Update the cube list with the new WALK_ANIMATION value
  }

  if(isBarking) {
    if (startTime2 === null) {
      startTime2 = performance.now(); // Capture the start time if not set
    }
    let duration2 = 1000;
    let elapsedTime2 = performance.now() - startTime2;
    var sound = new Audio('bark.mp3');
    let hasBarked = false; // Flag to check if the sound has already played
    setTimeout(() => {
      isBarking = false; // Reset the flag to prevent continuous barking
      MOUTH = 0; // Reset mouth animation
      populateCubeList();
      startTime2 = null; // Reset start time for barking
    }, duration2); // Duration of the animation (1 second)

    _anim = (Math.sin((elapsedTime2 / duration2) * 2 * Math.PI) + 1) / 2;
    MOUTH = _anim;
    populateCubeList(); // Update the cube list with the new WALK_ANIMATION value

    if (_prevAnim < 0.99 && _anim >= 0.99 && !hasBarked) {
      hasBarked = true; // Set the flag to indicate sound has played
      sound.play();
    }

    _prevAnim = _anim;
  }
}

function drawPyramid() {
  // Define vertices for a pyramid (base is a square, top is a single point)
  var vertices = new Float32Array([
    // Base (square)
    -0.5, 0.0, -0.5,
     0.5, 0.0, -0.5,
     0.5, 0.0,  0.5,
    -0.5, 0.0,  0.5,
    // Top point
     0.0, 1.0,  0.0,
  ]);

  // Define colors for each face
  var colors = new Float32Array([
    0.3, 0.3, 0.3, 1.0, // Uniform gray color for all vertices
    0.5, 0.5, 0.5, 1.0,
    0.6, 0.6, 0.6, 1.0,
    0.5, 0.5, 0.5, 1.0,
    0.4, 0.4, 0.4, 1.0,
  ]);

  // Define indices for the pyramid (triangles)
  var indices = new Uint8Array([
    // Base (two triangles)
    0, 1, 2,
    2, 3, 0,
    // Sides
    0, 1, 4,
    1, 2, 4,
    2, 3, 4,
    3, 0, 4,
  ]);

  var n = indices.length;

  // Create buffers
  var vertexBuffer = gl.createBuffer();
  var colorBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();

  if (!vertexBuffer || !colorBuffer || !indexBuffer) {
    console.log('Failed to create buffers');
    return;
  }

  // Write vertex coordinates
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // Write colors
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Color);

  // Write indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  // Set matrix
  var modelMatrix = new Matrix4();
  modelMatrix.setIdentity(); // Set to identity matrix
  modelMatrix.scale(0.2, 0.3, 0.2); // Scale down the pyramid
  modelMatrix.translate(0.0, 0.75, 0.0); // Translate to the center of the canvas
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}
