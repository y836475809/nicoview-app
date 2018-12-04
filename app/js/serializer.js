
const fs = require("fs");

/**
 * 
 * @param {string} file_path 
 */
let load = function (file_path) {
    const data = fs.readFileSync(file_path, "utf-8");
    return JSON.parse(data);
};

/**
 * 
 * @param {string} file_path 
 * @param {Map} obj 
 */
let save = function (file_path, obj, callback) {
    const value = Array.isArray(obj) ? [...obj] : obj;
    const data = JSON.stringify(value, null, "  ");
    if(!callback){
        callback = (err)=>{};
    }
    fs.writeFile(file_path, data, "utf-8", callback);
};

exports.load = load;
exports.save = save;