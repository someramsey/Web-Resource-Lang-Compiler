import { Range } from "./range";

export type ProcessorError = {
    message: string;
    range: Range;
};

export type ProcessorResult<T> = {
    output: T;
    errors: ProcessorError[];
}