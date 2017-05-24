
// window.onload = () => {
//     $('#add-btn').on("click", () => {
//         var ele = document.createElement("div")
//         ele.innerHTML = "message"
//         ele.className = "comment"
//         ele.style.left = 300 + "px"
//         ele.style.top = 50 + "px"
//         console.log('aaaaaaaaaaaaaaa')
//         // $('#container').appendChild(ele)
//         document.getElementById("container").appendChild(ele);
//     });
// }

// class comment_anime{
//     constructor(parent_id){
//         this.parent_id = parent_id
//     }

//     delete_elm(){

//     }
    
//     create_flow(text, width, duration){
        
//     }

//     create_fix(){

//     }
// }

let create_comment_elm = (parent_id,  text, width, duration) => {
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

    return {ele:ele, sp:sp}
    // document.getElementById("container").appendChild(ele);
}

let create_fix_comment = (parent_id,  text, width, duration) => {
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

    return {ele:ele, sp:sp}
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

module.exports = create_comment_elm