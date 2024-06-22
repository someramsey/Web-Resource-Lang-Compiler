export class Iteration<T> {
    private iterator: Iterator<T>;

    constructor(iterable: Iterable<T>) {
        this.iterator = iterable[Symbol.iterator]();
    }

    next(): T {
        return this.iterator.next().value;
    }
}
