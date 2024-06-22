import { Iteration } from "../iteration";
import { Position } from "../position";
import { Range } from "../range";

const breaks = [" ", "\t", "\n", "\r"];
const symbols = ["(", ")", "{", "}", "[", "]", ",", ";", ":", "."];

type ValueToken<Type, Value> = {
    kind: "value";
    type: Type;
    value: Value;
}

export type Token = {
    kind: "symbol" | "none";
    value: string;
    range: Range
} | ValueToken<"string", string> | ValueToken<"number", number>;

export function tokenizer(input: string): Token[] {
    const result: Token[] = [];
    const iteration = new Iteration(input);

    let head: Position = { column: 0, line: 0, index: 0 };
    let foot: Position = { column: 0, line: 0, index: 0 };

    let char: string;
    let captured: boolean = false;

    while (char = iteration.next()) {
        head.index++;

        if (char === "\n") {
            head.line++;
            head.column = 0;
        } else {
            head.column++;
        }

        if (breaks.includes(char)) {
            if (!captured) {
                //push uncaptured
            }

            foot = { ...head };
            captured = true;

            continue;
        }
        else if (symbols.includes(char)) {
            if (!captured) {
                //push uncaptured
            }

            foot = { ...head, index: head.index - 1 };

            //push symbol

            foot = { ...head };
            captured = true;

            continue;
        }

        captured = false;
    }

    return result;
}