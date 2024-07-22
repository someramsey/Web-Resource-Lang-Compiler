export class Iteration<T> {
    private iterator: Iterator<T>;
    private _current: T | undefined;
    private _last: T | undefined;
    private _done: boolean = false;

    constructor(iterable: Iterable<T>) {
        this.iterator = iterable[Symbol.iterator]();
    }

    next(): T {
        const { value, done } = this.iterator.next();
        
        this._last = this._current;
        this._current = value;
        this._done = done!;
        
        return value;
    }

    get current(): T {
        return this._current!;
    }

    get last(): T {
        return this._last!;
    }

    get done(): boolean {
        return this._done;
    }
}
