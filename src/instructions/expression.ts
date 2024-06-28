import { NodeMetaValue } from "../processors/transformer";

export type LiteralExpressionFragment<T extends NodeMetaValue = NodeMetaValue> = {
    kind: "literal";
    meta: T["meta"];
    value: T["value"];
};

export type ReferenceExpressionFragment = {
    kind: "reference";
    target: string;
};

export type AccessorExpressionFragment = {
    kind: "accessor";
    target: string;
};

export type ExpressionFragment = LiteralExpressionFragment | ReferenceExpressionFragment | AccessorExpressionFragment;

export type Expression = ExpressionFragment[];
