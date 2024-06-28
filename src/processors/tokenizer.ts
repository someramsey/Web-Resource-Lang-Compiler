import { Position } from "../position";
import { ProcessorError, ProcessorResult } from "../processor";
import { Range, Ranged } from "../range";

const breaks = [" ", "\t", "\n", "\r"];
const symbols = ["(", ")", "{", "}", "[", "]", ",", ";", ":", "-"];
const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const stringIndicators = ["'", '"'];

type BaseToken<Kind extends string> = { kind: Kind; } & Ranged;

export type BasicToken = { value: string; } & BaseToken<"symbol" | "none">;
export type ValueToken<T extends MetaValue<string, unknown>> = { metaValue: T } & BaseToken<"value">

export type PrimeMetaValue = MetaValue<"string", string> | MetaValue<"number", number>;
export type Token = BasicToken | ValueToken<PrimeMetaValue>;

export function tokenizer(input: string): ProcessorResult<Token[]> {
    const output: Token[] = [];
    const errors: ProcessorError[] = []

    let head: Position = { column: 0, line: 0, index: 0 };
    let foot: Position = { column: 0, line: 0, index: 0 };

    let captured: boolean = false;
    let stringTerminator = "'";

    const string = () => {
        let escaped = false;

        while (head.index < input.length) {
            const char = input[head.index];

            head.index++;
            head.column++;

            if (char === "\n") {
                head.line++;
                head.column = 0;

                errors.push(new ProcessorError("Unterminated string literal", Range.from(foot, head)));
            }

            if (!escaped) {
                if (char === "\\") {
                    escaped = true;
                }
                else if (char == stringTerminator) {
                    output.push({
                        kind: "value",
                        metaValue: {
                            meta: "string",
                            value: input.substring(foot.index, head.index - 1),
                        },
                        range: Range.from(foot, head)
                    });

                    return;
                }

            } else {
                escaped = false;
            }
        }

        errors.push(new ProcessorError("Unterminated string literal at eof", Range.from(foot, head)));
    };

    const comment = () => {
        while (head.index < input.length) {
            const char = input[head.index];

            if (char === "\n") {
                head.line++;
                head.column = 0;

                break;
            }

            head.index++;
        }
    };

    const dot = () => {
        while (head.index < input.length) {
            const char = input[head.index];

            if (char !== ".") {
                output.push({
                    kind: "symbol",
                    value: input.substring(foot.index - 1, head.index),
                    range: Range.from(foot, head)
                });

                break;
            }

            head.index++;
        }
    };

    const number = () => {
        while (head.index < input.length) {
            const char = input[head.index];

            if (!digits.includes(char)) {
                output.push({
                    kind: "value",
                    metaValue: {
                        meta: "number",
                        value: parseInt(input.substring(foot.index, head.index)),
                    },
                    range: Range.from(foot, head)
                });

                break;
            }

            head.index++;
        }
    };

    const capture = (char) => {
        switch (char) {
            case "#": return comment;
            case ".": return dot;
        }

        if (digits.includes(char)) {
            return number;
        } else if (stringIndicators.includes(char)) {
            stringTerminator = char;
            return string;
        } else if (symbols.includes(char)) return () => {
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
                value: input.substring(foot.index, head.index - 1),
                range: Range.from(foot, head)
            });
        }

        captured = true;
        foot = { ...head };
    };

    while (head.index < input.length) {
        const char = input[head.index];

        head.index++;

        if (char === "\r") {
            head.column = 0;
            continue;
        } else if (char === "\n") {
            head.line++;
            head.column = 0;
        } else {
            head.column++;
        }

        if (breaks.includes(char)) {
            pushUncaptured();
            continue;
        }

        const capturer = capture(char);

        if (capturer) {
            pushUncaptured();
            capturer();

            foot = { ...head };
            continue;
        }

        captured = false;
    }

    return { output, errors };
}