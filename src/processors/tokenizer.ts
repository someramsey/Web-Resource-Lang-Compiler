import { Iteration } from "../iteration";
import { Position } from "../position";
import { Range } from "../range";

const breaks = [" ", "\t", "\n", "\r"];
const symbols = ["(", ")", "{", "}", "[", "]", ",", ";", ":", "."];


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

export function tokenizer(input: string): Token[] {
    const result: Token[] = [];
    const iteration = new Iteration(input);

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

                //error unterminated string literal

                return;
            }

            if (!escaped) {
                if (char === "\\") {
                    escaped = true;
                }
                else if (char == "'") {
                    result.push({
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


        //error unterminated string literal at eof
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
    }

    const capture = () => {
        switch (char) {
            case "'": return string;
            case "#": return comment;
        }

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