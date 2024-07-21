import { Expression, ExpressionExtender, ValueExpression } from "../expression";
import { Iteration } from "../iteration";
import { ProcessorError } from "../processor";
import { Token } from "./tokenizer";
import { Node } from "./transformer";

export function readExpression(iteration: Iteration<Token>, mapper: (token: Token) => Node): Expression {
    const readExpressionExtenders = (): ExpressionExtender[] => {
        const extenders: ExpressionExtender[] = [];
        let state = "none";

        while (iteration.next()) {
            switch (state) {
                case "accessor": {
                    if (iteration.current.kind !== "none") {
                        throw new ProcessorError("Expected identifier", iteration.current.range);
                    }

                    extenders.push({
                        kind: "acessor",
                        name: iteration.current.value
                    });

                    state = "none";
                } break;

                case "indexer": {
                    const indexExpression = readExpression(iteration, mapper);

                    if (iteration.current.kind !== "symbol" || iteration.current.value !== "]") {
                        throw new ProcessorError("Expected ']'", iteration.current.range);
                    }

                    extenders.push({
                        kind: "indexer",
                        expression: indexExpression
                    });

                    state = "none";
                } break;

                case "none": {
                    if (iteration.current.kind === "symbol") {
                        if (iteration.current.value === ".") {
                            state = "accessor";
                        } else if (iteration.current.value === "[") {
                            state = "indexer";
                        } else {
                            return extenders;
                        }
                    } else {
                        return extenders;
                    }
                };
            }
        }

        throw new ProcessorError("Unexpected end of file", iteration.last.range);
    };

    const node = mapper(iteration.current);

    if (node.kind == "value") {
        const value: ValueExpression = {
            kind: "value",
            data: node.data
        };

        iteration.next();

        return value;
    } else if (node.kind == "none") {
        return {
            kind: "reference",
            name: node.value,
            extenders: readExpressionExtenders()
        };
    }

    throw new ProcessorError("Expected expression", node.range);
}
