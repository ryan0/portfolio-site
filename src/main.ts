import './style.css';
import {initShaderProgram} from "./shader-util.ts";

import {mat4} from 'gl-matrix';

const env = import.meta.env



let xRotation = 0;
let yRotation = 0;
function drawScene(gl: WebGL2RenderingContext, programInfo: ProgramInfo, deltaTime: number) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the canvas

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    const modelViewMatrix = mat4.create();

    xRotation += deltaTime / 10000;
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.5, -4.0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, xRotation, [1, 0, 0]);

    yRotation += deltaTime / 30000;
    mat4.rotate(modelViewMatrix, modelViewMatrix, xRotation, [0, 1, 0.1]);

    //yRotation += deltaTime / 1000;
    //mat4.rotate(modelViewMatrix, modelViewMatrix, xRotation, [1, 1, 1]);


    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    gl.drawArrays(gl.POINTS, 0, 24000);
}

interface ProgramInfo {
    program: WebGLProgram,
    attribLocations: {
        vertexPosition: GLint,
        vertexColor: GLint,
    },
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation,
        modelViewMatrix: WebGLUniformLocation,
    },
}

function main() {
    const canvas = <HTMLCanvasElement>document.getElementById("top-gl-canvas");
    const gl: WebGL2RenderingContext | null = canvas?.getContext("webgl2");
    if (!gl) {
        alert("Unable to initialize WebGL.");
        return;
    }

    resizeCanvas(gl);
    window.addEventListener('resize', () => {
        resizeCanvas(gl)
    });

    gl.clearColor(0.14, 0.14, 0.14, 1.0);
    gl.clearDepth(1.0) //clear everything
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL) //Near objects obscure distant ones


    const vertShaderPromise = fetch(env.BASE_URL + 'shaders/shader.vert').then(file => file.text());
    const fragShaderPromise = fetch(env.BASE_URL + 'shaders/shader.frag').then(file => file.text());
    Promise.all([vertShaderPromise, fragShaderPromise]).then(shaderStrings => {
        const shaderProgram = initShaderProgram(gl, shaderStrings[0], shaderStrings[1]);
        if (!shaderProgram) {
            return;
        }

        const projectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
        const modelViewMatrix = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
        if (!projectionMatrix || !modelViewMatrix) {
            return null;
        }

        const programInfo: ProgramInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix,
                modelViewMatrix
            },
        };

        const buffers = initBuffers(gl);
        if(!buffers) {
            return null;
        }

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        // Tell WebGL how to pull out the colors from the color buffer
        // into the vertexColor attribute.
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

        // Tell WebGL to use our program when drawing
        gl.useProgram(programInfo.program);


        let previousTimeStamp = 0;
        function render(timeStamp: number) {
            const deltaTime = timeStamp - previousTimeStamp;
            previousTimeStamp = timeStamp

            if (!gl || !buffers) {
                return;
            }

            drawScene(gl, programInfo, deltaTime);
        }

        setInterval (() => {
            requestAnimationFrame(render);
        }, 16)


    });
}


interface SimpleBuffers {
    position: WebGLBuffer,
    color: WebGLBuffer
}
function initBuffers(gl: WebGL2RenderingContext): SimpleBuffers | null {
    let positions = [];
    let i = 0;
    for (let x = 0; x < 20; x++)
        for (let y = 0; y < 20; y++)
            for (let z = 0; z < 20; z++) {
                positions[i] = x / 10.0 - 1.0;
                positions[i + 1] = y / 10.0 - 1.0;
                positions[i + 2] = z / 10.0 - 1.0;
                i += 3;
            }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    let colors = [];

    i = 0;
    for (let x = 0; x < 20; x++)
        for (let y = 0; y < 20; y++)
            for (let z = 0; z < 20; z++) {
                colors[i] = 0;
                colors[i + 1] = 0;
                colors[i + 2] = Math.min(Math.random() + .1, 1.0);
                colors[i + 4] = 1.0;
                i += 4;
            }
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    if (!positionBuffer || !colorBuffer) {
        return null;
    }

    return {
        position: positionBuffer,
        color: colorBuffer
    };
}


function resizeCanvas(gl: WebGL2RenderingContext) {
    if ("clientWidth" in gl.canvas && "clientHeight" in gl.canvas) {
        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}



window.onload = main;