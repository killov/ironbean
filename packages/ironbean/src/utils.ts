export function getAllPropertyNames(obj: object) {
    let result: string[] = [];
    while (obj) {
        Object.getOwnPropertyNames(obj).forEach(p => result.push(p));
        obj = Object.getPrototypeOf(obj);
    }
    return result;
}

export function cacheMap<K, V>(map: Map<K,V>, key: K, factory: () => V): V {
    let data = map.get(key);

    if (!data) {
        data = factory();
        map.set(key, data);
    }

    return data;
}