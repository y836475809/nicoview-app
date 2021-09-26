class MyObservable {
    constructor(){
        /** @type Map<string, Set> */
        this.callbacks = new Map();
    }
    on(event, fn){
        if(!this.callbacks.has(event)){
            this.callbacks.set(event, new Set());
        }
        this.callbacks.get(event).add(fn);
    }
    trigger(event, ...args){
        if(this.callbacks.has(event)){
            const fns = this.callbacks.get(event);
            fns.forEach(fn => fn(...args));
        }
    }
}

const createObs = () => {
    return new MyObservable();
};

module.exports = {
    MyObservable,
    createObs
};