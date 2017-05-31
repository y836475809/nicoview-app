// @ts-check

class comment_elm {
    /**
     * @param {string} parent_id
     * @param {number} width
     * @param {number} duration
     */
    constructor(parent_id, width, duration) {
        this.parent_id = parent_id

        /** @type {number} */
        this.width = width
        this.duration = duration
    }

    /**
     * 
     * @param {string} text 
     * @param {number} delay
     * @returns {{elm:HTMLElement, width:number, speed:number}} 
     */
    cretae_flow(text, delay) {
        let ele = document.createElement("div")
        ele.innerHTML = text
        ele.className = "comment"

        document.getElementById(this.parent_id).appendChild(ele);
        let rect = ele.getBoundingClientRect()
        let left = this.width
        let len = this.width + rect.width
        let sp = len / this.duration

        ele.style.left = left + "px"
        
        ele.setAttribute("data-x", (-len).toString())
        // ele.setAttribute("data-duration", this.duration.toString())
        ele.setAttribute("data-delay", delay.toString())

        return { ele: ele, width:rect.width, speed: sp }
    }
}


let create_comment_elm = (parent_id, text, width, duration) => {
    let ele = document.createElement("div")
    ele.innerHTML = text
    ele.className = "comment"
    // ele.setAttribute("data-x", -left)
    // ele.setAttribute("data-duration", 5000)
    // ele.style.left = left + "px"
    // ele.style.top = top + "px"

    document.getElementById(parent_id).appendChild(ele);
    let rect = ele.getBoundingClientRect()
    let left = width
    let len = width + rect.width
    let sp = len / duration

    ele.style.left = left + "px"
    // ele.style.top = top + "px"
    ele.setAttribute("data-x", -len)
    ele.setAttribute("data-duration", duration)

    return { ele: ele, sp: sp }
    // document.getElementById("container").appendChild(ele);
}

let create_fix_comment = (parent_id, text, width, duration) => {
    let ele = document.createElement("div")
    ele.innerHTML = text
    ele.className = "fix_comment"
    // ele.setAttribute("data-x", -left)
    // ele.setAttribute("data-duration", 5000)
    // ele.style.left = left + "px"
    // ele.style.top = top + "px"

    document.getElementById(parent_id).appendChild(ele);
    let rect = ele.getBoundingClientRect()
    let left = width
    let len = width + rect.width
    let sp = len / duration

    ele.style.left = left + "px"
    // ele.style.top = top + "px"
    ele.setAttribute("data-x", -len)
    ele.setAttribute("data-duration", duration)

    return { ele: ele, sp: sp }
    // document.getElementById("container").appendChild(ele);
}

// let set_comment_param = (c_param, top, width, duration) => {
//     // document.getElementById(id).appendChild(ele);
//     // let rect = ele.getBoundingClientRect()
//     let ele = c_param.ele
//     let rect = c_param.rect
//     let len = width + rect.width
//     // let sp = len / duration

//     ele.style.left = len + "px"
//     ele.style.top = top + "px"
//     ele.setAttribute("data-x", -len)
//     ele.setAttribute("data-duration", duration)

//     return { speed: sp }
// }

let set_comment_param = (text, left, top) => {

}

// @ts-ignore
module.exports = comment_elm