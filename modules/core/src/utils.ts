export function getAllPropertyNames(obj: object) {
    let result: string[] = [];
    while (obj) {
        Object.getOwnPropertyNames(obj).forEach(p => result.push(p));
        obj = Object.getPrototypeOf(obj);
    }
    return result;
}

export function isFunction(functionToCheck): boolean {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}