precision mediump float;

uniform float time;

uniform vec3 player;

uniform sampler2D colorMap;
uniform sampler2D normalMap;

varying vec3 fragmentPosition;
varying vec4 fragmentNormal;
varying vec2 fragmentUV;


vec3 transformQuat(vec3 a, vec4 q) {
    vec4 i = vec4( q.w * a.x + q.y * a.z - q.z * a.y,
                   q.w * a.y + q.z * a.x - q.x * a.z,
                   q.w * a.z + q.x * a.y - q.y * a.x,
                  -q.x * a.x - q.y * a.y - q.z * a.z);

    return vec3( i.x * q.w + i.w * -q.x + i.y * -q.z - i.z * -q.y,
                 i.y * q.w + i.w * -q.y + i.z * -q.x - i.x * -q.z,
                 i.z * q.w + i.w * -q.z + i.x * -q.y - i.y * -q.x);
}

void main(void) {
    vec3 lightVector = player-fragmentPosition;
    vec3 lightDir = normalize(lightVector);
    float lightDistance = length(lightVector);
    vec4 textureNormal = texture2D(normalMap, fragmentUV) * 2.0 - 1.0;
    vec3 normal = transformQuat(textureNormal.rgb, fragmentNormal);
    float light = dot(normal, lightDir) * 2.0 / sqrt(lightDistance);
    gl_FragColor = vec4(texture2D(colorMap, fragmentUV).rgb * light, 1.0);
}

