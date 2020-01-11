const path = require("path");

const rootRequire = name => {
    const root = path.join(__dirname, "..");
    return require(`${root}/${name}`);
};

const getPathFromRoot = (names) =>  {
    const root = path.join(__dirname, "..");
    return path.join(root, ...names);
};

module.exports = {
    rootRequire,
    getPathFromRoot,
};