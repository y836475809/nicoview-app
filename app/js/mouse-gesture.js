
class MouseGesture {
    constructor() {
        this._init();
        this._sensitivity = 50;
        this._enable = true;
        this.gesture = {
            left:       "left",
            right:      "right",
            up:         "up",
            down:       "down",
            left_up:    "left_up",
            left_down:  "left_down",
            right_up:   "right_up",
            right_down: "right_down",
        };
    }

    set enable(value){
        this._enable = value;
    }

    /**
     * 
     * @param {(gesture:string)=>void} on_gesture 
     */
    onGesture(on_gesture) {
        this._on_gesture = on_gesture;
    }

    /**
     * 
     * @param {MouseEvent} e 
     */
    mouseDown(e) {
        this._mouseDown(e.button, {
            x: e.pageX,
            y: e.pageY
        });
    }

    /**
     * 
     * @param {MouseEvent} e 
     */
    mouseUp(e) {
        this._mouseUp({
            x: e.pageX,
            y: e.pageY
        });
    }

    _init() {
        this._gutter = false;
        this._start_pos = null;
    }

    /**
     * 
     * @param {number} button 
     * @param {{x:number, y:number}} pos 
     */
    _mouseDown(button, pos) {
        if (button === 2) {
            this._gutter = true;
            this._start_pos = pos;
        } else {
            this._init();
        }
    }

    /**
     * 
     * @param {{x:number, y:number}} pos 
     */
    _mouseUp(pos) {
        if (this._gutter && this._start_pos && this._enable) {
            let dir_x = this._start_pos.x - pos.x;
            let dir_y = this._start_pos.y - pos.y;
            if (Math.abs(dir_x) < this._sensitivity) {
                dir_x = 0;
            }
            if (Math.abs(dir_y) < this._sensitivity) {
                dir_y = 0;
            }

            if (dir_x > 0 && dir_y == 0) {
                this._on_gesture(this.gesture.left);
            }

            if (dir_x < 0 && dir_y == 0) {
                this._on_gesture(this.gesture.right);
            }

            if (dir_x == 0 && dir_y > 0) {
                this._on_gesture(this.gesture.up);
            }

            if (dir_x == 0 && dir_y < 0) {
                this._on_gesture(this.gesture.down);
            }

            if (dir_x > 0 && dir_y > 0) {
                this._on_gesture(this.gesture.left_up);
            }

            if (dir_x < 0 && dir_y < 0) {
                this._on_gesture(this.gesture.left_down);
            }

            if (dir_x > 0 && dir_y > 0) {
                this._on_gesture(this.gesture.right_up);
            }
            if (dir_x < 0 && dir_y < 0) {
                this._on_gesture(this.gesture.right_down);
            }
        }

        this._init();
    }
}

module.exports = {
    MouseGesture,
};