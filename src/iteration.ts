export class Iteration<T> {
    private iterator: Iterator<T>;
    private _current: T | undefined;
    private _last: T | undefined;

    constructor(iterable: Iterable<T>) {
        this.iterator = iterable[Symbol.iterator]();
    }

    next(): T {
        const value = this.iterator.next().value;
        this._last = this._current;
        this._current = value;
        return value;
    }

    get current(): T {
        return this._current!;
    }

    get last(): T {
        return this._last!;
    }



    until(predicate: (value: T) => boolean, ended?: () => void) {
        while (this.next()) {
            if (predicate(this.current)) {
                break;
            }
        }

        ended?.();
    }
}
