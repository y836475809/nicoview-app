/**
 * リストアイテムにドラッグドロップを設定
 */
class ListviewDragDrop {
    /**
     * @param {string} name リストビューを識別するための名前
     * @param {(from:number, to:number)=>void} move_item_func stateのアイテムをindexのfromからtoに入れ替える
     */
    constructor(name, move_item_func){
        this.name = name;
        this.move_item_func = move_item_func;
    }
    /**
     * ドロップ先候補に付けていた線をクリアする
     * @param {HTMLElement} elm ドロップ先候補の要素
     */
    _clear_border(elm){
        if(!elm){
            return;
        }
        elm.style.borderTop = "";
        elm.style.borderBottom = "";
    }
    /**
     * ドロップ先候補に線を付ける
     * @param {string} index_data ドロップ先候補要素のindex(data属性の値)
     * @param {number} client_y マウスカーソルのy位置
     */
    _set_border(index_data, client_y){
        const elm = this._get_item_elm(index_data);
        if(!elm){
            return;
        }
        const rect = elm.getBoundingClientRect();
        if((client_y - rect.top) < (elm.clientHeight / 2)){
            // マウスカーソルの位置が要素の半分より上
            elm.style.borderTop = "2px solid blue";
            elm.style.borderBottom = "";
        }else{
            // マウスカーソルの位置が要素の半分より下
            elm.style.borderTop = "";
            elm.style.borderBottom = "2px solid blue";
        }
    }
    /**
     * マウスカーソル位置や移動元と移動先のindexの比較で移動先indexを
     * 調整しないといけないのでその調整値を返す
     * @param {string} from_index_data 移動元要素のindex(data属性の値)
     * @param {string} to_index_data 移動先要素のindex(data属性の値)
     * @param {number} client_y マウスカーソルのy位置
     * @returns {number}
     */
    _get_adjust_for_to_index(from_index_data, to_index_data, client_y){
        // マウスカーソルの位置が要素の半分より下の場合+1
        const to_elm = this._get_item_elm(to_index_data);
        let rect = to_elm.getBoundingClientRect();  
        const i1 = (client_y - rect.top) >= (to_elm.clientHeight / 2)?1:0;
        
        // 移動元のindexが移動先indexより小さい場合+1
        const from_index = this.get_index(from_index_data);
        const to_index = this.get_index(to_index_data);
        const i2 = from_index < to_index?-1:0;

        return i1 + i2;
    }
    /**
     * 要素のdata属性(data-index)からindexを返す
     * @param {string} index_data 
     * @returns {number} 
     */
    get_index(index_data){
        return Number(index_data);
    }
    /**
     * リストアイテム要素を返す
     * @param {string} index_data 要素のindex(data属性の値)
     * @returns {HTMLElement}
     */
    _get_item_elm(index_data){
        const selector = `.listview-list.${this.name} .listview-item[data-index="${index_data}"]`;
        return document.querySelector(selector);
    }
    /**
     * リストアイテムの子要素にデータ属性としてindex値を設定して
     * リストアイテム要素のリストを返す
     * @returns {NodeListOf<Element>}
     */
    _get_items(){
        const elms = document.querySelectorAll(`.listview-list.${this.name} li`);
        elms.forEach (/** @param {HTMLElement} elm */ elm => {
            const data_index = elm.dataset.index;
            const selector = `.listview-list.${this.name} .listview-item[data-index="${data_index}"] div`;
            const ch_elms = document.querySelectorAll(selector);
            ch_elms.forEach(/** @param {HTMLElement} ch_elm */ ch_elm => {
                ch_elm.dataset.index = data_index;
            });
        });
        return elms;
    }
    /**
     * リストアイテム要素がドラッグドロップできるように設定
     * リストアイテムが最初に設定された時と変更される度に設定が必要
     */
    setup_drag_drop(){
        const elms = this._get_items();
        elms.forEach (/** @param {HTMLElement} elm */ elm => {
            elm.ondragstart = (e) => {
                /** @type {HTMLElement} */
                const target_elm = e.target;
                const index = target_elm.dataset.index;
                e.dataTransfer.setData("text/plain", `${this.name}:${index}`);
                e.dataTransfer.effectAllowed = "move";
            };
            elm.ondragover = (e) => {
                e.stopPropagation();
                e.preventDefault();

                /** @type {HTMLElement} */
                const target_elm = e.target;
                const index_data = target_elm.dataset.index;
                if(!index_data){
                    return;
                }
                this._set_border(index_data, e.clientY);
            };
            elm.ondragleave = (e) => {
                e.stopPropagation();
                e.preventDefault();

                /** @type {HTMLElement} */
                const target_elm = e.target;
                const index_data = target_elm.dataset.index;
                if(!index_data){
                    return;
                }
                this._clear_border(this._get_item_elm(index_data));
            };
            elm.ondrop = (e) => {
                e.stopPropagation();
                e.preventDefault();

                /** @type {HTMLElement} */
                const target_elm = e.target;
                if(!target_elm.dataset.index){
                    return;
                }

                const to_index_data = target_elm.dataset.index;
                /** @type {HTMLElement} */
                const to_elm = this._get_item_elm(to_index_data);
                if(!to_elm){
                    return;
                }
                this._clear_border(to_elm);

                // ドラッグした要素のデータから名前と移動元indexデータ取得
                const from_data = e.dataTransfer.getData('text/plain');
                const [name, from_index_data] = from_data.split(":");
                if(name != this.name){
                    // 他のリストビューの要素なので何もしない
                    return;
                }
                
                const adj = this._get_adjust_for_to_index(from_index_data, to_index_data, e.clientY);
                this.move_item_func(
                    this.get_index(from_index_data), 
                    this.get_index(to_index_data) + adj);

                const from_elm = this._get_item_elm(from_index_data);
                const dorped_elm = this._get_item_elm((Number(to_index_data)+adj).toString());
                from_elm.classList.remove("selected");
                dorped_elm.classList.add("selected");
            };
        });
    }
}

module.exports = {
    ListviewDragDrop
};