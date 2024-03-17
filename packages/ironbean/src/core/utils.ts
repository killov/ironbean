export function getAllPropertyNames(obj: object) {
    let result: string[] = [];
    while (obj) {
        Object.getOwnPropertyNames(obj).forEach(p => result.push(p));
        obj = Object.getPrototypeOf(obj);
    }
    return result;
}

export class AsyncInstance<T> {
    promise: Promise<T>

    constructor(promise: Promise<T>) {
        this.promise = promise;
    }
}

export function isPrimitive(type: any): boolean {
    switch (type) {
        case Number:
        case String:
        case Boolean:
        case Array:
        case Map:
        case Set:
            return true;
        default:
            return false;
    }
}