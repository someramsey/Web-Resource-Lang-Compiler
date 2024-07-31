import { Expression } from "./expression";
import { BlockMetaData } from "./meta";

export type ThemeSignature = {
    type: "theme";
    identifier: string;
};

export type FontSignature = {
    type: "font";
    identifier: string;
    source: string | null;
};

export type FontOptions = {
    weights: number[] | null;
    style: "normal" | "italic" | "oblique" | null;
};

type BaseDefinition<TSignature, TBody> = { signature: TSignature; body: TBody; };

export type Signature = ThemeSignature | FontSignature;

export type Definition<TSignature extends Signature = Signature> =
    TSignature extends ThemeSignature ? BaseDefinition<ThemeSignature, BlockMetaData> :
    TSignature extends FontSignature ? BaseDefinition<FontSignature, FontOptions> :
    never;

export type UnresolvedDefinition = BaseDefinition<Signature, Expression>;