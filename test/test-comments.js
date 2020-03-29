
let getRandom = (min, max)=>{
    return Math.floor(Math.random() * (max-min+1) + min);
};

let randomText = (min, max)=>{
    const s = "abcdefghijklmnopqrstuvwxyz0123456789()!?^あいうえおかきくけこさしすせそー";
    
    let cm = "";
    const cm_len = getRandom(min, max);
    for (let index = 0; index < cm_len; index++) {
        cm += s[getRandom(0, s.length-1)];
    }

    return cm;
};

const randomComments = (cm_num, interval_ms) => {
    const interval_min = 200/10;
    const interval_max = interval_ms/10;
    const text_max = 30;

    let cms = [];
    cms.push({ no: 1, vpos: 0, content: randomText(1, text_max), mail:"" });

    for (let index = 1; index < cm_num; index++) {
        const text = randomText(1, text_max);
        const interval = getRandom(interval_min, interval_max);
        const vpos = cms[cms.length-1].vpos + interval;
        cms.push({ no: index+1, vpos: vpos, content: text, mail:"" });
    }

    return cms;
};

const sampleComments = () => {
    return  [
        { no: 1, vpos: 0,    content: "あああああああああAAAああああ" , mail:"" },
        { no: 2, vpos: 143,  content: "いいいいいい" , mail:"big" },
        { no: 3, vpos: 241,  content: "うううううううううううううう", mail:"" },
        { no: 4, vpos: 274,  content: "ええええええええええ", mail:"" },
        { no: 5, vpos: 362,  content: "おおおおおおおおおおおお", mail:"" },
        { no: 6, vpos: 399,  content: "かかかかかかかかかかかかかかか" , mail:"" },
        { no: 7, vpos: 432,  content: "ききき", mail:""  },
        { no: 8, vpos: 635,  content: "bbbbくくくくくくくくくくくくくくくく", mail:"" },
        { no: 9, vpos: 712,  content: "けけけけけけ", mail:"" },
        { no: 10, vpos: 743, content: "ここここここここここここここここここここここここここここここ", mail:"" },
    ];
};

const fixedSampleComments = () => {
    return  [
        { no: 1, vpos: 0,    content: "あああああああああAAAああああ" , mail:"ue" },
        { no: 2, vpos: 100,  content: "いいいいいい" , mail:"big ue" },
        { no: 3, vpos: 200,  content: "うううううううううううううう", mail:"ue" },
        { no: 4, vpos: 400,  content: "ええええええええええ", mail:"ue" },
        { no: 5, vpos: 500,  content: "おおおおおおおおおおおお", mail:"ue" },
        { no: 6, vpos: 600,  content: "かかかかかかかかかかかかかかか" , mail:"ue" },
        { no: 7, vpos: 800,  content: "ききき", mail:"ue" },
        { no: 8, vpos: 900,  content: "bbbbくくくくくくくくくくくくくくくく", mail:"ue" },
        { no: 9, vpos: 1000,  content: "けけけけけけ", mail:"ue" },
        { no: 10, vpos: 1100, content: "ここここここここここここ", mail:"ue" },
        { no: 11, vpos: 50,   content: "#Aああああ#" , mail:"shita" },
        { no: 12, vpos: 400,  content: "#いいいいいい#" , mail:"shita" },
        { no: 13, vpos: 450,  content: "#ううう#" , mail:"shita" },
    ];
};

const randomfixedComments = (cm_num, interval_ms) => {
    const interval_min = 200/10;
    const interval_max = interval_ms/10;
    const text_max = 30;

    let cms = [];
    cms.push({ no: 1, vpos: 0, content: randomText(1, text_max), mail:"ue" });

    for (let index = 1; index < cm_num; index++) {
        const text = randomText(1, text_max);
        const interval = getRandom(interval_min, interval_max);
        const vpos = cms[cms.length-1].vpos + interval;
        const pos = getRandom(0, 1) < 0.5?"ue":"shita";
        cms.push({ no: index+1, vpos: vpos, content: text, mail:pos });
    }

    return cms;
};

module.exports = {
    randomComments,
    sampleComments,
    fixedSampleComments,
    randomfixedComments
};