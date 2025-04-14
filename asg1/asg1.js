// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_PointSize;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_PointSize;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

class Point {
  constructor() {
    this.type = 'point'; // Type of shape
    this.position = [0, 0]; // Default position
    this.color = [1, 1, 1, 1]; // Default color (white)
    this.size = 10; // Default size
    this.sides = 10; // Default number of sides for circle
  }
}

var shapeMode = 'point'; // Default shape mode

function main() {
  var canvasVals = setupWebGL();
  var canvas = canvasVals[0];
  var gl = canvasVals[1];

  var glslVals = connectVariablesToGLSL(gl);
  var a_Position = glslVals[0]; // Get the storage location of a_Position
  var u_FragColor = glslVals[1]; // Get the storage location of u_FragColor
  var u_PointSize = glslVals[2]; // Get the storage location of u_PointSize

  // Register function (event handler) to be called on a mouse press
  canvas.onmousemove = function(ev){
    if(ev.buttons == 1) // If the left button is pressed
      click(ev, gl, canvas, a_Position, u_FragColor, u_PointSize) 
  };

  canvas.onmousedown = function(ev){
    if(ev.buttons == 1) // If the left button is pressed
      click(ev, gl, canvas, a_Position, u_FragColor, u_PointSize)
  }


  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function click(ev, gl, canvas, a_Position, u_FragColor, u_PointSize) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  var red = parseFloat(document.getElementById('red').value) || 0;
  var green = parseFloat(document.getElementById('green').value) || 0;
  var blue = parseFloat(document.getElementById('blue').value) || 0;
  var color = [red, green, blue, 1]; // RGBA color

  var size = parseFloat(document.getElementById('size').value) || 10;
  var sides = parseInt(document.getElementById('segments').value) || 10; // Number of sides for circle
  
  let point = new Point(); // Create a new Point object
  point.type = shapeMode; // Set the type of shape
  point.position = [x, y]; // Set the position of the point
  point.color = color; // Set the color of the point
  point.size = size; // Set the size of the point
  point.sides = sides; // Set the number of sides for circle
  g_shapesList.push(point); // Add the point to the shapes list

  renderAllShapes(a_Position, u_FragColor, u_PointSize, gl);
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

  return [canvas, gl];
}

function connectVariablesToGLSL(gl) {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
    
  // Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_PointSize
  var u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
  if (!u_PointSize) {
    console.log('Failed to get the storage location of u_PointSize');
    return;
  }

  return [a_Position, u_FragColor, u_PointSize];
}

function renderAllShapes(a_Position, u_FragColor, u_PointSize, gl) {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    var shapeType = g_shapesList[i].type;
    var xy = g_shapesList[i].position;
    var rgba = g_shapesList[i].color;
    var size = g_shapesList[i].size;
    var sides = g_shapesList[i].sides;
    
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // Pass the size of a point to u_PointSize variable
    gl.uniform1f(u_PointSize, size);

    if(shapeType == 'point') {
      // Pass the position of a point to a_Position variable
      gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
      // Draw
      gl.drawArrays(gl.POINTS, 0, 1);
    }
    else if(shapeType == 'triangle') {
      // Draw triangle
      let [x, y] = xy;
      scale = 0.01 * size; // Scale the triangle based on size
      drawTriangle(gl, [x, y + scale, x - scale, y - scale, x + scale, y - scale]);
    }
    else if(shapeType == 'circle') {
      // Draw circle
      let [x, y] = xy;
      drawCircle(gl, x, y, sides, size);
    }

  }
}

function clearCanvas() {
  g_shapesList = []; // Clear the shapes list

  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function drawTriangle(gl, [x1, y1, x2, y2, x3, y3]) {
  var vertices = new Float32Array([
    x1, y1,   x2, y2,   x3, y3
  ]);
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLES, 0, n);

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(a_Position);
}

function drawCircle(gl, x, y, num_sides, size) {
  var vertices = [];
  var angleStep = (2 * Math.PI) / num_sides;
  var scale = 0.01 * size; // Scale the circle based on size

  for (var i = 0; i <= num_sides; i++) {
    var angle = i * angleStep;
    vertices.push(x + scale * Math.cos(angle));
    vertices.push(y + scale * Math.sin(angle));
  }

  var verticesArray = new Float32Array(vertices);

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  // Draw the circle as a triangle fan
  gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(a_Position);
}

function setDrawingMode(string) {
  switch(string) {
    case 'point':
      shapeMode = 'point';
      break;
    case 'triangle':
      shapeMode = 'triangle';
      break;
    case 'circle':
      shapeMode = 'circle';
      break;
  }
}