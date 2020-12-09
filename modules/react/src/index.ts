import {FunctionComponent, ReactNode, useContext, useRef, createElement, createContext, useEffect} from "react";
import {ApplicationContext, getBaseApplicationContext} from "fire-dic";

export function useBean<T>(Class: new (...any: any[]) => T): T {
    const beanRef = useRef<T>();
    const componentAppContext = useContext(reactContext)

    if (beanRef.current === undefined) {
        const context: ApplicationContext = componentAppContext || getBaseApplicationContext();
        beanRef.current = context.getBean(Class);
    }

    useEffect(() => {
        beanRef.current = undefined;
    }, [componentAppContext])

    return beanRef.current;
}

const reactContext = createContext<ApplicationContext|null>(null);

interface IApplicationContextProviderProps {
    context: ApplicationContext;
    children: ReactNode;
}

export const ApplicationContextProvider: FunctionComponent<IApplicationContextProviderProps> = (props) => {
    return createElement(reactContext.Provider, {value: props.context}, props.children);
}