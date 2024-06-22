import { Position } from "./position";

export class Range {
    public begin: Position;
    public end: Position;

    constructor(begin: Position, end: Position) {
        this.begin = begin;
        this.end = end;
    }

    static from(begin: Position, end: Position) {
        return new Range({ ...begin }, { ...end });
    }
}