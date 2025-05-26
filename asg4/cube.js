class Cube {
    constructor() {
      this.colors = new Float32Array([
        // Front face
        1.0, 0.0, 0.0, 1.0,  // Red
        1.0, 0.0, 0.0, 1.0,  // Red
        1.0, 0.0, 0.0, 1.0,  // Red
        1.0, 0.0, 0.0, 1.0,  // Red
        // Back face
        0.0, 1.0, 0.0, 1.0,  // Green
        0.0, 1.0, 0.0, 1.0,  // Green
        0.0, 1.0, 0.0, 1.0,  // Green
        0.0, 1.0, 0.0, 1.0,  // Green
        // Top face
        0.0, 0.0, 1.0, 1.0,  // Blue
        0.0, 0.0, 1.0, 1.0,  // Blue
        0.0, 0.0, 1.0, 1.0,  // Blue
        0.0, 0.0, 1.0, 1.0,  // Blue
        // Bottom face
        1.0, 1.0, 0.0, 1.0,  // Yellow
        1.0, 1.0, 0.0, 1.0,  // Yellow
        1.0, 1.0, 0.0, 1.0,  // Yellow
        1.0, 1.0, 0.0, 1.0,  // Yellow
        // Right face
        1.0, 0.0, 1.0, 1.0,  // Magenta
        1.0, 0.0, 1.0, 1.0,  // Magenta
        1.0, 0.0, 1.0, 1.0,  // Magenta
        1.0, 0.0, 1.0, 1.0,  // Magenta
        // Left face
        0.0, 1.0, 1.0, 1.0,  // Cyan
        0.0, 1.0, 1.0, 1.0,  // Cyan
        0.0, 1.0, 1.0, 1.0,  // Cyan
        0.0, 1.0, 1.0, 1.0   // Cyan
      ]);

      this.matrix = new Matrix4(); // identity matrix
      this.useTexture = false; // default to not using texture
      this.textureIndex = 0;
    }
}

var vertexBuffer, texCoordBuffer, indexBuffer, colorBuffer;
var texture0, texture1;  // Assuming textures are initialized elsewhere
var lastUse = -1;
var lastIndex = -1;

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

// Texture coordinates for each vertex
var texCoords = new Float32Array([
  // Front face
  0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
  // Back face (90-degree counterclockwise rotation)
  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,  0.0, 0.0,
  // Top face
  0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
  // Bottom face
  0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
  // Right face (90-degree counterclockwise rotation)
  0.0, 0.0,  0.0, 1.0,  1.0, 1.0,  1.0, 0.0,
  // Left face
  0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0
]);

var indices = new Uint8Array([
  0, 1, 2,   2, 3, 0,    // front
  4, 5, 6,   6, 7, 4,    // back
  8, 9,10,  10,11, 8,    // top
 12,13,14,  14,15,12,    // bottom
 16,17,18,  18,19,16,    // right
 20,21,22,  22,23,20     // left
]);

var cubeNormal = new Float32Array([
  // Front
  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
  // Back
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  // Top
  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
  // Bottom
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  // Right
  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
  // Left
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
]);



function initBuffers(gl) {
  vertexBuffer = gl.createBuffer();
  texCoordBuffer = gl.createBuffer();
  indexBuffer = gl.createBuffer();
  colorBuffer = gl.createBuffer();
  normalBuffer = gl.createBuffer();

  SvertexBuffer = gl.createBuffer();
  StexCoordBuffer = gl.createBuffer();
  SindexBuffer = gl.createBuffer();
  ScolorBuffer = gl.createBuffer();
  SnormalBuffer = gl.createBuffer();

  if (!vertexBuffer || !texCoordBuffer || !indexBuffer || !colorBuffer || !normalBuffer) {
    console.log('Failed to create buffers');
    return false;
  }

  if (!SvertexBuffer || !StexCoordBuffer || !SindexBuffer || !ScolorBuffer || !SnormalBuffer) {
    console.log('Failed to create sphere buffers');
    return false;
  }
  return true;
}

function drawCube(gl, a_Position, a_Color, a_TexCoord, u_ModelMatrix, cube) {
  
  var n = indices.length;
  
  // Write vertex coordinates
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  // Write texture coordinates
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0); // Assuming a_TexCoord is used for texture coordinates
  gl.enableVertexAttribArray(a_TexCoord);

  // Set v_Color in the vertex shader
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.colors, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Color);
  
  // Write indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeNormal, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);
  
  // Set matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, cube.matrix.elements);

  const normalMatrix = computeNormalMatrix(cube.matrix.elements);
  gl.uniformMatrix3fv(u_NormalMatrix, false, normalMatrix);

  // Set texture usage
  if(lastUse !== cube.useTexture)
    gl.uniform1i(u_UseTexture, cube.useTexture ? 1 : 0);
  if(lastIndex !== cube.textureIndex)
    gl.uniform1i(u_TextureIndex, cube.textureIndex);

  // Bind appropriate texture if enabled
  if (cube.useTexture && cube.textureIndex !== lastIndex) {
    const texUnit = cube.textureIndex || 0;
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, texUnit === 0 ? texture0 : texture1);
    gl.uniform1i(gl.getUniformLocation(gl.program, 'u_Sampler' + texUnit), texUnit);
  }

  lastUse = cube.useTexture;
  lastIndex = cube.textureIndex;

  // Draw
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function clearCubeList() {
    for (var i = 0; i < cubeList.length; i++) {
        cubeList[i] = null; // Clear the cube object
    }
    cubeList.length = 0; // Clear the array
}

  function initTextures(gl) {
    texture0 = gl.createTexture(); // Create a texture object
    texture1 = gl.createTexture(); // Create a texture object
  
    var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0'); // Get the storage location of u_Sampler
    if (!u_Sampler0) {
      console.log('Failed to get the storage location of u_Sampler0');
      return false;
    }

    var image = new Image(); // Create an image object
    image.onload = function() { loadTexture(gl, texture0, u_Sampler0, image); }; 
    image.src = 'dirt.jpg'; // Specify the image source

    var u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1'); // Get the storage location of u_Sampler
    if (!u_Sampler1) {
      console.log('Failed to get the storage location of u_Sampler1');
      return false;
    }
  
    var image2 = new Image(); // Create an image object
    image2.onload = function() { loadTexture(gl, texture1, u_Sampler1, image2); }; 
    image2.src = 'stone.png'; // Specify the image source
  
    return true;
}
  
  function loadTexture(gl, texture, u_Sampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y-axis
    gl.activeTexture(gl.TEXTURE0); // Activate texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the texture object to target
  
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  
    // Assign the image object to the texture object
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
    gl.uniform1i(u_Sampler, 0); // Pass the texture unit to u_Sampler
}

function drawSphere(gl, a_Position, a_Color, a_TexCoord) {
  const radius = 1;
  const latitudeBands = 10;
  const longitudeBands = 10;

  const vertices = [];
  const colors = [];
  const texCoordsArr = [];
  const indicesArr = [];

  for (let lat = 0; lat <= latitudeBands; lat++) {
    const theta = lat * Math.PI / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longitudeBands; lon++) {
      const phi = lon * 2 * Math.PI / longitudeBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = radius * cosPhi * sinTheta;
      const y = radius * cosTheta;
      const z = radius * sinPhi * sinTheta;

      vertices.push(x, y, z);
      colors.push(1, 1, 1, 1);
      texCoordsArr.push(lon / longitudeBands, lat / latitudeBands);
    }
  }

  for (let lat = 0; lat < latitudeBands; lat++) {
    for (let lon = 0; lon < longitudeBands; lon++) {
      const first = lat * (longitudeBands + 1) + lon;
      const second = first + longitudeBands + 1;

      indicesArr.push(first, second, first + 1);
      indicesArr.push(second, second + 1, first + 1);
    }
  }

  // Use sphere-specific buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, SvertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, SnormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, ScolorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STREAM_DRAW);
  gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Color);

  gl.bindBuffer(gl.ARRAY_BUFFER, StexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoordsArr), gl.STREAM_DRAW);
  if (a_TexCoord !== undefined && a_TexCoord !== -1) {
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TexCoord);
  }

  // Pass a default identity matrix for u_NormalMatrix
  gl.uniformMatrix3fv(u_NormalMatrix, false, new Float32Array([1,0,0, 0,1,0, 0,0,1]));

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, SindexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesArr), gl.STREAM_DRAW);

  gl.drawElements(gl.TRIANGLES, indicesArr.length, gl.UNSIGNED_SHORT, 0);
}

function computeNormalMatrix(modelMatrix) {
  // Clone model matrix to avoid modifying the original
  const normalMatrix4 = new Matrix4(modelMatrix);
  normalMatrix4.invert();   // Invert the model matrix
  normalMatrix4.transpose(); // Transpose the inverse

  // Extract the top-left 3x3 part (normal matrix) into a flat 9-element array
  const e = normalMatrix4.elements;
  return new Float32Array([
    e[0], e[1], e[2],
    e[4], e[5], e[6],
    e[8], e[9], e[10]
  ]);
}

  