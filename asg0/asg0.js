// DrawRectangle.js
function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG
    var ctx = canvas.getContext('2d');

    // Draw a black rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a black color
    ctx.fillRect(10, 10, 410, 410); // Fill a rectangle with the color

    // Instantiate a vector v1 using the Vector3 class
    var v1 = new Vector3([5, 0, 0.0]);
    var v2 = new Vector3([0, 5, 0.0]);
    drawVector(v1, "red"); // Draw v1 in red
    drawVector(v2, "blue"); // Draw v2 in blue
}

function drawVector(v, color) {
    var x_offset = 205;
    var y_offset = 205;
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;

    // Start a new Path
    ctx.beginPath();
    ctx.moveTo(x_offset, y_offset);
    ctx.lineTo(x_offset + (v.elements[0] * 20), y_offset - (v.elements[1] * 20));

    // Draw the Path
    ctx.stroke();
}

function handleDrawEvent(x1, y1, x2, y2, op, scalar) {
    // Retrieve <canvas> element
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG
    var ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a blue rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a black color
    ctx.fillRect(10, 10, 410, 410); // Fill a rectangle with the color

    // Instantiate a vector v1 using the Vector3 class
    var v1 = new Vector3([x1, y1, 0.0]);
    var v2 = new Vector3([x2, y2, 0.0]);
    drawVector(v1, "red"); // Draw v1 in red
    drawVector(v2, "blue"); // Draw v2 in blue

    switch (op) {
        case 'add':
            var v3 = v1.add(v2);
            break;
        case 'subtract':
            var v3 = v1.sub(v2);
            break;
        case 'multiply':
            var v3 = v1.mul(scalar);
            var v4 = v2.mul(scalar);
            break;
        case 'divide':
            var v3 = v1.div(scalar);
            var v4 = v2.div(scalar);
            break;
        case 'magnitude':
            console.log("Magnitude V1: " + v1.magnitude());
            console.log("Magnitude V2: " + v2.magnitude());
            break;
        case 'normalize':
            var v3 = v1.normalize();
            var v4 = v2.normalize();
            break;
        case 'dot':
            var dotProduct = Vector3.dot(v1, v2);
            console.log("Dot Product: " + dotProduct);
            break;
        case 'area':
            var cross = Vector3.cross(v1, v2);
            console.log("Area: " + cross.magnitude() * 0.5);
            break;
    }
    if (v3) {
        drawVector(v3, "green"); // Draw v3 in green
    }
    if (v4) {
        drawVector(v4, "yellow"); // Draw v4 in yellow
    }
}