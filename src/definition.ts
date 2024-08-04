import { Expression } from "./expression";
import { BlockMetaData } from "./meta";

export type ThemeDefinition<T extends BlockMetaData | Expression> = {
    type: "theme";
    identifier: string;
    body: T;
};

export type FontDefinition<T extends FontOptions | Expression> = {
    type: "font";
    identifier: string;
    source: string | null;
    body: T;
};

export const FontStyles = ["normal", "italic", "oblique", "all"] as const;
export type FontStyle = typeof FontStyles[number];

export type FontOptions = {
    weights: number[] | null;
    style: FontStyle[] | null;
};

export type Definition =
    ThemeDefinition<BlockMetaData> |
    FontDefinition<FontOptions>;

export type UnresolvedDefinition = 
    ThemeDefinition<Expression> |
    FontDefinition<Expression>;
    