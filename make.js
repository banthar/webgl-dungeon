#!/usr/bin/js

const fs = require('fs');

const resourcesDir = "resources";

const resources = {}

function pack(type, bytes) {
    switch( type ) {
        case "png":
            return "data:image/png;base64,"+bytes.toString("base64");
        case "glslf":
        case "glslv":
            return bytes.toString("utf8");
        default:
            throw "Unknown file extension: " + type;    
    }
}

fs.readdirSync(resourcesDir).forEach(function(file) {
    const type = file.split(".").pop();
    const bytes = fs.readFileSync(resourcesDir+"/"+file);
    resources[file] = pack(type, bytes);
})

fs.writeFileSync("resources.js", "const resources = " + JSON.stringify(resources));

