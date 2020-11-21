import {constants} from "./enums";

export function destroyFieldsForAutowired(object: object) {
    const properties = getAllPropertyNames(object);

    for (const property of properties) {
        if(Reflect.getMetadata(constants.autowired, object, property)) {
            // @ts-ignore
            delete object[property];
        }
    }
}

export function getAllPropertyNames(obj: object) {
    let result: string[] = [];
    while (obj) {
        Object.getOwnPropertyNames(obj).forEach(p => result.push(p));
        obj = Object.getPrototypeOf(obj);
    }
    return result;
}