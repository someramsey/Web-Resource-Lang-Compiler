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

    const capture = () => {
        if (symbols.includes(char)) return () => {
            result.push({
                kind: "symbol",
                value: char,
                range: Range.from(foot, head)
            });
        };

    };

    const pushUncaptured = () => {
        if (!captured) {
            result.push({
                kind: "none",
                value: input.substring(head.index, foot.index),
                range: Range.from(foot, head)
            });

            captured = false;
            foot = { ...head };
        }
    };

    while (char = iteration.next()) {
        head.index++;

        if (char === "\n") {
            head.line++;
            head.column = 0;
        } else {
            head.column++;
        }

        if (breaks.includes(char)) {
            pushUncaptured();
            continue;
        }

        const capturer = capture();

        if (capturer) {
            pushUncaptured();
            capturer();
            
            captured = true;
            foot = { ...head };
            continue;
        }

        captured = false;
    }

    return result;
}