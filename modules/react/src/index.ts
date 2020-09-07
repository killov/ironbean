import {useRef} from "react";
import {getBaseApplicationContext} from "fire-dic";

export function useBean<T>(Class: new (...any: any[]) => T): T {
    const beanRef = useRef<T>();

    if (beanRef.current === undefined) {
        beanRef.current = getBaseApplicationContext().getBean(Class);
    }

    return beanRef.current;
}