import {useState} from "react";
import {getBaseApplicationContext} from "fire-dic";

export function useBean<T>(Class: new (...any: any[]) => T): T {
    let [bean, setBean] = useState<T|null>(null)

    if (bean === null) {
        bean = getBaseApplicationContext().getBean(Class);
        setBean(bean);
    }

    return bean;
}