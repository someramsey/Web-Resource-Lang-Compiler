import { Iteration } from "../iteration";
import { Position } from "../position";
import { Range } from "../range";

const breaks = [" ", "\t", "\n", "\r"];
const symbols = ["(", ")", "{", "}", "[", "]", ",", ";", ":", ".", "'"];

type Token = {
    type: "word" | "symbol"
    value: string;
    range: Range
}

export function lexer(input: string): Token[] {
    const tokens: Token[] = [];
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
                tokens.push({
                    type: "word",
                    value: input.slice(foot.index, head.index - 1),
                    range: {
                        begin: { ...foot },
                        end: { ...head }
                    }
                });
            }

            foot = { ...head };
            captured = true;
        }
        else if (symbols.includes(char)) {
            if (!captured) {
                tokens.push({
                    type: "word",
                    value: input.slice(foot.index, head.index - 1),
                    range: {
                        begin: { ...foot },
                        end: { ...head }
                    }
                });
            }

            foot = { index: head.index - 1, column: head.column, line: head.line }

            tokens.push({
                type: "symbol",
                value: char,
                range: {
                    begin: { ...foot },
                    end: { ...head }
                }
            });

            foot = { ...head };
            captured = true;
        } else {
            captured = false;
        }

    }

    return tokens;
}