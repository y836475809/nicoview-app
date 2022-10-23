
class NicoGridStateRestor {
    /**
     * 
     * @param {NicoGridState} state 
     */
    constructor(state){
        this._state = state;
    }
    /**
     * 
     * @param {object[]} columns 
     * @returns {object[]}
     */
    getColumns(state, columns){
        if(!state){
            return columns;
        }
        const ordered_columns = [];
        state.columns.forEach(state_column=>{
            const col = columns.find(column=>{
                return column.id == state_column.id;
            });
            col.width = state_column.width;
            ordered_columns.push(col);
        });
        return ordered_columns;
    }
    /**
     * 
     * @returns {NicoGridSortParam}
     */
    getSortParam(state){
        if(!state){
            return {
                id: "",
                asc: true
            };
        }
        return state.sort_param; 
    }
}

/**
 * 
 * @param {string} selector 
 * @param {NicoGridState} state 
 * @param {MyObservable} obs 
 * @param {object[]} columns 
 * @param {object} options 
 */
const mountNicoGrid = (selector, state, obs, columns, options) => {
    const prop = {
        obs: obs,
        columns: [],
        options: {}
    };
    Object.assign(prop.options, options);

    const state_restor = new NicoGridStateRestor(state);
    prop.columns = state_restor.getColumns(state, columns);
    const sort_param = state_restor.getSortParam(state);
    prop.options.sort_param = sort_param;
    riot.mount(selector, prop, "nico-grid");
};

module.exports = {
    mountNicoGrid
};