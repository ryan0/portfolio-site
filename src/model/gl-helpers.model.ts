
export interface ProgramInfo {
    program: WebGLProgram,
    attribLocations: {
        vertexPosition: GLint,
        vertexColor: GLint,
    },
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation,
        modelViewMatrix: WebGLUniformLocation,
        pointSize: WebGLUniformLocation
    },
}

export interface SimpleBuffers {
    position: WebGLBuffer,
    color: WebGLBuffer
}