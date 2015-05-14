attribute vec3 vertexPosition;
attribute vec4 vertexNormal;
attribute vec2 vertexUV;

varying vec3 fragmentPosition;
varying vec4 fragmentNormal;
varying vec2 fragmentUV;

uniform mat4 transform;

void main(void) {
    fragmentPosition = vertexPosition;
    fragmentNormal = vertexNormal;
    fragmentUV = vertexUV;
    gl_Position = transform * vec4(vertexPosition, 1.0);
}
