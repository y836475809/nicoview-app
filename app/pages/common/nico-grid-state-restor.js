
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

module.exports = {
    NicoGridStateRestor
};