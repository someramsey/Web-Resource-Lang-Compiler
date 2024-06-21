"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const data = fs_1.default.readFileSync("data/sample", "utf-8");
const iterator = data[Symbol.iterator]();
let next = iterator.next();
while (next.done) {
    next = iterator.next();
}
