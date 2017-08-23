
describe('test electron', function () {
    before(function () {
        this.elem = document.querySelector('.target');
    });

    it('test', function () {
        let ele = document.createElement("div")
        ele.innerHTML = "text"
        // document.appendChild(ele)

        let rect = ele.getBoundingClientRect()
        console.log("rect=", rect)
    });
});