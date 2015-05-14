"use strict";

function Player(map) {
    this.map = map;
    this.pos = vec3.fromValues(0.5, 0.5, 0.5);
    this.rot = vec2.fromValues(Math.PI * 0.5, 0);
    this.size = vec3.fromValues(0.2, 0.2, 0.2);
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
}

Player.prototype.collides = function() {
    var vertices = [
        [ -1, -1, -1],
        [ -1, -1,  1],
        [ -1,  1, -1],
        [ -1,  1,  1],
        [  1, -1, -1],
        [  1, -1,  1],
        [  1,  1, -1],
        [  1,  1,  1],
    ];
    for( var v of vertices ) {
        var p = vec3.clone(v);
        vec3.multiply(p, p, this.size);
        vec3.add(p, p, this.pos);
        if( this.map.get(Math.floor(p[0]), Math.floor(p[1]), Math.floor(p[2])) != 0 ) {
            return true;
        }
    }
    return false;
},

Player.prototype.tick = function() {
    var v = vec3.fromValues((this.left?-1:0) + (this.right?1:0), (this.up?1:0) + (this.down?-1:0), 0);

    var transform = mat4.create();
    mat4.rotateZ(transform, transform, this.rot[1]);
    vec3.transformMat4(v, v, transform);

    vec3.scale(v, v, 0.05);
    for(var d=0;d<3;d++) {
        this.pos[d] += v[d];
        if( this.collides() ) {
            this.pos[d] -= v[d];
        }
    }
}

