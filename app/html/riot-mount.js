/* globals riot */

/**
 * riotタグののマウント準備ができたことを確認してからマウントする
 * @param {string} selector マウントするタグ
 */
const roitMount = (selector) => {  // eslint-disable-line no-unused-vars
    const wait_sec = 500;
    const int_id = setInterval(async () => { 
        // data-mountready=trueになっていれば準備OK
        /** @type {HTMLElement} */
        const elm = document.querySelector("[data-mountready]");
        if(elm && elm.dataset.mountready=="true"){
            elm.dataset.mountready = "done";
            await riot.compile();
            riot.mount(selector);
            clearInterval(int_id);
        } 
    }, wait_sec);
};
