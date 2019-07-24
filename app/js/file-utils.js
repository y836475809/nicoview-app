const fs = require("fs");
const path = require("path");

const mkDirp = (dir) => {
    try {
        fs.statSync(dir);
    } catch (error) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const normalizePath = (file_path) => {
    return file_path.replace(/^(file:\/\/\/)|^(file:\/\/)/i, "").replace(/\//g, path.sep);
};

module.exports = {
    FileUtils:{
        mkDirp,
        normalizePath,
    }
};