import { Range } from "../range";

export class ProcessorError extends Error {
    public range: Range;

    constructor(message: string, range: Range) {
        super(message);
        this.range = range;
        this.name = "ProcessorError";
    }
}

export type ProcessorResult<T> = {
    output: T;
    errors: ProcessorError[];
}