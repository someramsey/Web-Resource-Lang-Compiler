import { ValueToken } from "../processors/tokenizer";

type ValueExpression = {
    kind: "value";
    type: ValueToken["type"];
    value: ValueToken["value"];
};

type ReferenceExpression = {
    kind: "reference";
    target: string;
};

type AccessorExpression = {
    kind: "accessor";
    query: ValueExpression | ReferenceExpression;
};

export type ExpressionFragment = ValueExpression | ReferenceExpression | AccessorExpression;

export type AssignmentInstruction = {
    kind: "assignment";
    id: string;
    expression: ExpressionFragment[];
};
