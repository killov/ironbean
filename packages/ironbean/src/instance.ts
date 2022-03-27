import {AsyncInstance} from "./utils";

export class Instance<T> {
    value: T;

    isAsync(): boolean {
        return this.value instanceof AsyncInstance;
    }

    constructor(value: T) {
        this.value = value;
    }
}