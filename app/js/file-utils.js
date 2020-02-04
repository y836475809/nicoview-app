const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const mkDirp = (dir) => {
    try {
        fs.statSync(dir);
    } catch (error) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const exist = async (full_path) => {
    try {
        await fsPromises.stat(full_path);
        return true;
    } catch (error) {
        return false;
    }
};


const normalizePath = (file_path) => {
    return file_path.replace(/^(file:\/\/\/)|^(file:\/\/)/i, "").replace(/\//g, path.sep);
};

module.exports = {
    FileUtils:{
        mkDirp,
        normalizePath,
        exist
    }
};