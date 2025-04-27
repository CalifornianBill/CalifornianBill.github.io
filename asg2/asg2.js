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

function main() {
  var canvasVals = setupWebGL();
  var canvas = canvasVals[0];
  var gl = canvasVals[1];

  var glslVals = connectVariablesToGLSL(gl);
  var a_Position = glslVals[0];
  var a_Color = glslVals[1];
  var u_ModelMatrix = glslVals[2];
  var u_GlobalRotation = glslVals[3];

  var cubeList = [];

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
  
  //Body
  var cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(0, 0, 0);
  M.scale(0.9/2, 0.6/2, 0.6/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Mane
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(-0.75/2, 0.05/2, 0);
  M.scale(0.6/2, 0.7/2, 0.8/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Head
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(-1.2/2, 0.05/2, 0);
  M.scale(0.3/2, 0.6/2, 0.6/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Snout
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(-1.5/2, -0.1/2, 0);
  M.scale(0.3/2, 0.3/2, 0.3/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Ears
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(-1.1/2, 0.45/2, 0.2/2);
  M.scale(0.1/2, 0.2/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list
  
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(-1.1/2, 0.45/2, -0.2/2);
  M.scale(0.1/2, 0.2/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Legs
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(-0.8/2, -0.65/2, 0.15/2);
  M.scale(0.2/2, 0.7/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list
  
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(0.25/2, -0.65/2, 0.15/2);
  M.scale(0.2/2, 0.7/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list
  
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(-0.8/2, -0.65/2, -0.15/2);
  M.scale(0.2/2, 0.7/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list
  
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(0.25/2, -0.65/2, -0.15/2);
  M.scale(0.2/2, 0.7/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  //Tail
  cube = new Cube(); // Create a cube object
  M = new Matrix4();
  M.setTranslate(0.65/2, -0.15/2, 0/2);
  M.rotate(45, 0, 0, 1);
  M.scale(0.2/2, 0.8/2, 0.2/2);
  cube.matrix = M; // Set the model matrix for the cube
  cubeList.push(cube); // Add the cube to the list

  renderScene(gl, a_Position, a_Color, u_ModelMatrix, u_GlobalRotation, cubeList);

  // Attach slider event listener
  document.getElementById('xSlider').addEventListener('input', function() {
    updateRotationAngle(gl, u_GlobalRotation);
    clearCanvas(gl);
    renderScene(gl, a_Position, a_Color, u_ModelMatrix, u_GlobalRotation, cubeList);
  });

  document.getElementById('ySlider').addEventListener('input', function() {
    updateRotationAngle(gl, u_GlobalRotation);
    clearCanvas(gl);renderScene(gl, a_Position, a_Color, u_ModelMatrix, u_GlobalRotation, cubeList);
  });
}

function setupWebGL() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST)

  return [canvas, gl];
}

function connectVariablesToGLSL(gl) {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return;
  }

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  var u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  if (!u_GlobalRotation) {
    console.log('Failed to get the storage location of u_GlobalRotation');
    return;
  }

  return [a_Position, a_Color, u_ModelMatrix, u_GlobalRotation];
}

function clearCanvas(gl) {
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

function updateRotationAngle(gl, u_GlobalRotation) {
  var xSlider = document.getElementById('xSlider');
  var xAngle = xSlider.value; // get current slider value
  var ySlider = document.getElementById('ySlider');
  var yAngle = ySlider.value; // get current slider value

  var rotationMatrix = new Matrix4();
  rotationMatrix.setIdentity(); // Start with identity matrix
  rotationMatrix.rotate(-xAngle, 1, 0, 0); // Rotate around X axis
  rotationMatrix.rotate(yAngle, 0, 1, 0); // Rotate around Y axis

  gl.uniformMatrix4fv(u_GlobalRotation, false, rotationMatrix.elements);
}

function renderScene(gl, a_Position, a_Color, u_ModelMatrix, u_GlobalRotation, cubeList) {
  clearCanvas(gl);
  for (var i = 0; i < cubeList.length; i++) {
    drawCube(gl, a_Position, a_Color, u_ModelMatrix, u_GlobalRotation, cubeList[i]);
  }
}