import { ProcessorError, ProcessorResult } from "../processor";
import { Iteration } from "../iteration";
import { Position } from "../position";
import { Range } from "../range";

const breaks = [" ", "\t", "\n", "\r"];
const symbols = ["(", ")", "{", "}", "[", "]", ",", ";", ":", "."];
const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

type BaseToken = {
    range: Range;
}

type ValueToken<Type, Value> = {
    kind: "value";
    type: Type;
    value: Value;
} & BaseToken;

type StandartToken = {
    kind: "symbol" | "none";
    value: string;
} & BaseToken;

export type Token = StandartToken | ValueToken<"string", string> | ValueToken<"number", number>;

export function tokenizer(input: string): ProcessorResult<Token[]> {
    const iteration = new Iteration(input);

    const output: Token[] = [];
    const errors: ProcessorError[] = []

    let head: Position = { column: 0, line: 0, index: 0 };
    let foot: Position = { column: 0, line: 0, index: 0 };

    let char: string;
    let captured: boolean = false;

    const string = () => {
        let escaped = false;

        while (char = iteration.next()) {
            head.index++;

            if (char === "\n") {
                head.line++;
                head.column = 0;

                errors.push({
                    message: "Unterminated string literal",
                    range: Range.from(foot, head)
                });
            }

            if (!escaped) {
                if (char === "\\") {
                    escaped = true;
                }
                else if (char == "'") {
                    output.push({
                        kind: "value",
                        type: "string",
                        value: input.substring(foot.index, head.index),
                        range: Range.from(foot, head)
                    });

                    return;
                }

            } else {
                escaped = false;
            }
        }

        errors.push({
            message: "Unterminated string literal",
            range: Range.from(foot, head)
        });
    };

    const comment = () => {
        while (char = iteration.next()) {
            head.index++;

            if (char === "\n") {
                head.line++;
                head.column = 0;

                break;
            }
        }
    };

    const number = () => {
        while (char = iteration.next()) {
            head.index++;

            if (!digits.includes(char)) {
                output.push({
                    kind: "value",
                    type: "number",
                    value: parseInt(input.substring(foot.index, head.index)),
                    range: Range.from(foot, head)
                });

                return;
            }
        }
    };

    const capture = () => {
        switch (char) {
            case "'": return string;
            case "#": return comment;
        }

        if(digits.includes(char)) return number;
        
        if (symbols.includes(char)) return () => {
            output.push({
                kind: "symbol",
                value: char,
                range: Range.from(foot, head)
            });
        };
    };

    const pushUncaptured = () => {
        if (!captured) {
            output.push({
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

    return { output, errors };
}