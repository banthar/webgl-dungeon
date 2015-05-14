"use strict";

function main(canvas) {

    canvas.tabIndex = 0;

    canvas.onclick = function() {
      canvas.requestPointerLock();
    }

    canvas.onmousemove = function(e) {
        var s = vec2.fromValues(-e.movementY, -e.movementX);
        vec2.scale(s, s, 0.01);
        vec2.add(player.rot, player.rot, s);

        player.rot[0]=clamp(player.rot[0], 0, Math.PI);
    }

    var gl = canvas.getContext("webgl");

    function clamp(v, min, max) {
        return Math.max(min,Math.min(v,max));
    }

    canvas.onkeydown = function(e) {
        switch(e.keyCode){
            case 65:
                player.left = true;
                break;
            case 68:
                player.right = true;
                break;
            case 87:
                player.up = true;
                break;
            case 83:
                player.down = true;
                break;
            default:
                console.log("keyDown:", e.keyCode);
                break;
        }
    }

    canvas.onkeyup = function(e) {
        switch(e.keyCode){
            case 65:
                player.left = false;
                break;
            case 68:
                player.right = false;
                break;
            case 87:
                player.up = false;
                break;
            case 83:
                player.down = false;
                break;
            default:
                console.log("keyUp:", e.keyCode);
                break;
        }
    }

    function getShader(source, type) {
        if(!source) {
            throw "Invalid source: " + source;
        }
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw gl.getShaderInfoLog(shader);
        }
        return shader;
    }

    var shaderProgram;

    {
        var fragmentShader = getShader(resources["shader.glslf"], gl.FRAGMENT_SHADER);
        var vertexShader = getShader(resources["shader.glslv"], gl.VERTEX_SHADER);

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw "Could not initialise shaders";
        }

        gl.useProgram(shaderProgram);

        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    }


    function loadTexture(texture, fileName) {
        var image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        image.src = resources[fileName];
    }

    var triangles;

    function initBuffers() {
        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        var vertices = map.draw();
        triangles = vertices.length / 8;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    }

    var tilesTexture = gl.createTexture();
    loadTexture(tilesTexture, "tiles.png");
    var tilesNormal = gl.createTexture();
    loadTexture(tilesNormal, "tiles_normal.png");

    function tick() {
        player.tick();
        drawScene();
        requestAnimationFrame(tick);
    }

    var startTime=new Date().getTime();

    function time() {
        return new Date().getTime()-startTime;
    }

    var map = new Map(16, 16);
    map.generate();

    var player = new Player(map);

    var buffer = map.draw(gl);

    var start = new Date().getTime();

    function drawScene() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.cullFace(gl.BACK);
        gl.enable(gl.CULL_FACE);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);

        var attributeIndex = 0;
        var attributeOffset = 0;
        var attributeStride = 0;

        for( var a of buffer.attributes ) {
            attributeStride += a.size;
        }

        for( var a of buffer.attributes ) {
            var location = gl.getAttribLocation(shaderProgram, a.name);
            if( location == -1 ) {
                //throw "Unknown attribute: " + a.name;
                location = attributeIndex;
            }
            gl.enableVertexAttribArray(attributeIndex);
            attributeIndex++;
            gl.vertexAttribPointer(location, a.size, gl.FLOAT, false, attributeStride*4, attributeOffset*4);
            attributeOffset += a.size;
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tilesTexture);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "colorMap"), 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tilesNormal);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "normalMap"), 1);

        gl.uniform1f(gl.getUniformLocation(shaderProgram, "time"), (new Date().getTime() - start)*0.001);
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "player"), player.pos);

        var transform = mat4.create();
        var d = 0.1;
        var aspect = width/height;
        mat4.frustum(transform, -d*aspect, d*aspect, -d, d, 0.1, 300.0);
        mat4.rotateX(transform, transform, -player.rot[0]);
        mat4.rotateZ(transform, transform, -player.rot[1]);

        var p = vec3.clone(player.pos);
        vec3.scale(p, p, -1);
        mat4.translate(transform, transform, p);

        var transformUniform = gl.getUniformLocation(shaderProgram, "transform");

        gl.uniformMatrix4fv(transformUniform, false, transform);
        gl.drawArrays(gl.TRIANGLES, 0, buffer.triangles);
    }

    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();

    window.gl = gl;
    window.player = player;
    window.map = map;

}

