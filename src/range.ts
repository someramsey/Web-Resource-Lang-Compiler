import { Token } from "./core/processors/tokenizer";

export type Position = {
    column: number;
    line: number;
    index: number;
}

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

    static between(begin: Token, end: Token) {
        return new Range(begin.range.begin, end.range.end);
    }
}

export type Ranged = {
    range: Range;
};