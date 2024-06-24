export class Iteration<T> {
    private iterator: Iterator<T>;
    private curr: T | undefined;

    constructor(iterable: Iterable<T>) {
        this.iterator = iterable[Symbol.iterator]();
    }

    next(): T {
        const value = this.iterator.next().value;
        this.curr = value;
        return value;
    }

    get current(): T {
        return this.curr!;
    }
}
