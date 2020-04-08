
const deepCopy = (obj) => {
    if ( typeof obj === "boolean" || typeof obj === "number" 
    || typeof obj === "string" || obj === null ) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        const ret = [];
        obj.forEach(value => { 
            ret.push(deepCopy(value)); 
        });
        return ret;
    }
    
    if (typeof obj === "object") {
        const ret = {};
        Object.keys(obj).forEach(key => {
            ret[key] = deepCopy(obj[key]);
        });
        return ret;
    }

    return null;
};


module.exports = {
    deepCopy
};