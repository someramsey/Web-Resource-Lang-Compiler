import { Expression, ValueLiteralExpression } from "./expression";
import { BlockMetaData } from "./meta";

export type Assignment = {
    type: "assignment";
    identifier: string;
    expression: Expression;
};

export type ThemeDefinition = {
    type: "theme";
    identifier: string;
    expression: ValueLiteralExpression & { data: BlockMetaData }
}


export type Instruction = Assignment | ThemeDefinition;