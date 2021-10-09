class MyObservable {
    constructor(){
        /** @type Map<string, Set> */
        this.callbacks = new Map();
        this.return_callbacks = new Map();
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

    onReturn(event, fn){
        if(this.return_callbacks.has(event)){
            throw new Error(`${event} is registered`);
        }
        this.return_callbacks.set(event, fn);
    }
    async triggerReturn(event, ...args){
        if(this.return_callbacks.has(event)){
            const fn = this.return_callbacks.get(event);
            if(fn.constructor.name === "AsyncFunction"){
                return await fn(...args);
            }else{
                return fn(...args);
            }
        }
    }
    hasReturnEvent(event){
        return this.return_callbacks.has(event);
    }
}

const createObs = () => {
    return new MyObservable();
};

module.exports = {
    MyObservable,
    createObs
};