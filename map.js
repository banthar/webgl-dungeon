"use strict";

Map = function(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height);
}

Map.prototype.get = function(x, y, z) {
    if(z != 0) {
        return 1;
    }
    if( this.range(x, y) ) {
        return this.data[this.offset(x, y)];
    } else {
        return 1;
    }
}

Map.prototype.set = function(x, y, v) {
    this.data[this.offset(x, y)] = v;
}

Map.prototype.range = function(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
}

Map.prototype.offset = function(x,y) {
    return x + y * this.width;
}

Map.prototype.generate = function() {
    for(var y=0; y<this.height; y++) {
        for(var x=0; x<this.width; x++) {
            this.set(x, y, x&y&1|(Math.random()>0.9?1:0));
        }
    }
}

Map.prototype.dump = function() {
    var s = "";
    for(var y=0; y<this.height; y++) {
        for(var x=0; x<this.width; x++) {
            s += this.get(x, y) + (x==this.width-1?"\n":" ");
        }
    }
    return s;
}

Map.prototype.drawBlock = function(vertices, x, y, z) {

/*     0         3
        +---------+
       /         /|
      /         / |
   1 /       2 /  |
    +---------+   |
    |         |   +
    |         |  /
    |         | /
    |         |/
    +---------+
*/

    var face = [
        [-.5,  .5, .5],
        [-.5, -.5, .5],
        [ .5, -.5, .5],
        [ .5,  .5, .5],
    ];

    var texCoord = [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
    ];

    var normal = [0, 0, 1];

    var transparent = this.get(x, y, z) == 0;

    var transforms = [
        [             0,            0,            0,              1],
        [           0.5,          0.5,          0.5,            0.5],
        [             0, Math.SQRT1_2, Math.SQRT1_2,              0],
        [          -0.5,          0.5,          0.5,           -0.5],
        [ -Math.SQRT1_2,            0,            0, -Math.SQRT1_2 ],
        [            -1,            0,            0,             0 ],
    ];

/*
    var transforms = [];

    {
        var t = quat.create();
        transforms.push(quat.clone(t));

        t = quat.create();
        quat.rotateY(t,t,-Math.PI/2);
        transforms.push(quat.clone(t));

        t = quat.create();
        quat.rotateX(t,t,-Math.PI/2);
        transforms.push(quat.clone(t));

        t = quat.create();
        quat.rotateX(t,t,Math.PI/2);
        transforms.push(quat.clone(t));

        t = quat.create();
        quat.rotateX(t,t,Math.PI);
        quat.rotateZ(t,t,Math.PI);
        transforms.push(quat.clone(t));

        t = quat.create();
        quat.rotateY(t,t,Math.PI/2);
        transforms.push(quat.clone(t));

        t = quat.create();
        quat.rotateY(t,t,-Math.PI/2);
        transforms.push(quat.clone(t));
    }
*/
    for(var transform of transforms) {

        var n = vec3.clone(normal);
        vec3.transformQuat(n, n, transform);

        if( transparent ) {
            continue;
        } else {
            if(this.get(Math.round(x + n[0]), Math.round(y + n[1]), Math.round(z + n[2])) != 0) {
                continue;
            }
        }


        for(var triangle of [[0, 1, 2],[0, 2, 3]]) {
            for(var v of triangle) {
                var tface = vec3.clone(face[v]);
                vec3.transformQuat(tface, tface, transform);
                vec3.add(tface, tface, vec3.fromValues(x + 0.5, y + 0.5, z + 0.5));
                for(var c of tface) {
                    vertices.push(c);
                }
                for(var c of transform) {
                    vertices.push(c);
                }

                var vertexTexCoord = vec2.clone(texCoord[v]);
                vec2.scale(vertexTexCoord, vertexTexCoord, 62);
                vec2.add(vertexTexCoord, vertexTexCoord, vec2.fromValues(1, 1));
                vec2.scale(vertexTexCoord, vertexTexCoord, 1.0/256.0);
                if( n[2] == 0 ) {
                    vertexTexCoord[0] += 0.25;
                } else if( n[2] == -1 ) {
                    vertexTexCoord[0] += 0.50;
                }
                for(var c of vertexTexCoord) {
                    vertices.push(c);
                }
            }
        }
    }
}

Map.prototype.draw = function(gl) {
    var vertices = [];
    for(var y=-1;y<=this.height;y++) {
        for(var x=-1;x<=this.width;x++) {
            for(var z=-1;z<=1;z++) {
                this.drawBlock(vertices, x, y, z);
            }
        }
    }

    var triangles = vertices.length / 9;

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    return {
        attributes: [
            {
                name: 'vertexPosition',
                size: 3,
            },
            {
                name: 'vertexNormal',
                size: 4,
            },
            {
                name: 'vertexUV',
                size: 2,
            },
        ],
        buffer: buffer,
        triangles: triangles,
    };
}
