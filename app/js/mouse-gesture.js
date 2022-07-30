
class MouseGesture {
    constructor() {
        this._init();

        this._sensitivity = 50;

        this._config = {};

        this._gesture = {
            left:       "left",
            right:      "right",
            up:         "up",
            down:       "down",
            left_up:    "left_up",
            left_down:  "left_down",
            right_up:   "right_up",
            right_down: "right_down",
        };

        this._action_map = {};

        this._action_names = {
            search_back_page:    "search-page-back-page",
            search_forward_page: "search-page-forward-page",
            all_show_player:     "all-page-show-player",
        };

        this._items = [
            { 
                text:   "動画検索で前ページに移動", 
                action: this._action_names.search_back_page 
            },
            { 
                text:   "動画検索で次ページに移動", 
                action: this._action_names.search_forward_page 
            },
            { 
                text:   "プレイヤーを前面に表示", 
                action: this._action_names.all_show_player 
            },
        ];
    }

    get name() {
        return "mouse_gesture";
    }

    get items() {
        return this._items;
    }

    get defaultConfig() {
        const config = {};
        for (const [key, value] of Object.entries(this._action_names)) { // eslint-disable-line no-unused-vars
            config[value] = "-";
        }
        return config;
    }

    get config() {
        return this._config;
    }

    set config(value) {
        this._config = value;
    }

    /**
     * 
     * @param {string} gesture 
     * @param {string} action 
     */
    setGesture(gesture, action) {  
        this._config[action] = gesture;
    }

    /**
     * 
     * @param {string} action 
     */
    setActionSearchBackPage(action) {
        const action_name = this._action_names.search_back_page;
        this._action_map[action_name] = action;
    }

    /**
     * 
     * @param {string} action 
     */
    setActionSearchFowardPage(action) {
        const action_name = this._action_names.search_forward_page;
        this._action_map[action_name] = action;
    }

    /**
     * 
     * @param {string} action 
     */
    setActionShowPalyer(action) {
        const action_name = this._action_names.all_show_player;
        this._action_map[action_name] = action;
    }

    /**
     * 
     * @param {string} page 
     * @param {string} gesture 
     * @returns {boolean}
     */
    action(page, gesture) {
        for (const [action_name, config_gesture] of Object.entries(this._config)) {
            if(action_name.startsWith(page)) {
                continue;
            }
            if(config_gesture == gesture) {
                if(action_name in this._action_map) {
                    this._action_map[action_name]();
                    return true;
                }   
            }
        }
        return false;
    }

    /**
     * 
     * @param {string} on_gesture 
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
        if (this._gutter && this._start_pos) {
            let dir_x = this._start_pos.x - pos.x;
            let dir_y = this._start_pos.y - pos.y;
            if (Math.abs(dir_x) < this._sensitivity) {
                dir_x = 0;
            }
            if (Math.abs(dir_y) < this._sensitivity) {
                dir_y = 0;
            }

            if (dir_x > 0 && dir_y == 0) {
                this._on_gesture(this._gesture.left);
            }

            if (dir_x < 0 && dir_y == 0) {
                this._on_gesture(this._gesture.right);
            }

            if (dir_x == 0 && dir_y > 0) {
                this._on_gesture(this._gesture.up);
            }

            if (dir_x == 0 && dir_y < 0) {
                this._on_gesture(this._gesture.down);
            }

            if (dir_x > 0 && dir_y > 0) {
                this._on_gesture(this._gesture.left_up);
            }

            if (dir_x < 0 && dir_y < 0) {
                this._on_gesture(this._gesture.left_down);
            }

            if (dir_x > 0 && dir_y > 0) {
                this._on_gesture(this._gesture.right_up);
            }
            if (dir_x < 0 && dir_y < 0) {
                this._on_gesture(this._gesture.right_down);
            }
        }

        this._init();
    }
}

module.exports = {
    MouseGesture,
};