const fs = require("fs");
const api_data_json = require("./sm32951089_api_data.json");

function escapeHtml(str){
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/>/g, "&gt;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/"/g, "&quot;");
    str = str.replace(/'/g, "&#x27;");
    str = str.replace(/`/g, "&#x60;");
    str = str.replace(/\//g, "\\/");
    return str;
}

const j = JSON.stringify(api_data_json);
const hh = escapeHtml(j);
const html = escape("hh");

console.log(hh);
