import { Expression, ValueLiteralExpression } from "./expression";
import { BlockMetaData } from "./meta";

export type Assignment = {
    type: "assignment";
    identifier: string;
    expression: Expression;
};

type BlockValueLiteralExpression = ValueLiteralExpression & {
    data: BlockMetaData;
};

export type ThemeDefinition = {
    type: "theme";
    identifier: string;
    expression: BlockValueLiteralExpression
}

export type FontDefinition = {
    type: "font";
    identifier: string;
    expression: BlockValueLiteralExpression,
    source: string | null
}

export type Instruction = Assignment | ThemeDefinition | FontDefinition;