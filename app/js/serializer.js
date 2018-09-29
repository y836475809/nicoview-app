
const fs = require('fs');

/**
 * 
 * @param {string} file_path 
 */
let load = function (file_path) {
    const data = fs.readFileSync(file_path, "utf-8");
    return new Map(JSON.parse(data));
};

/**
 * 
 * @param {string} file_path 
 * @param {Map} obj 
 */
let save = function (file_path, obj) {
    const data = JSON.stringify([...obj], null, "  ");
    fs.writeFileSync(file_path, data, "utf-8");
};

exports.load = load;
exports.save = save;