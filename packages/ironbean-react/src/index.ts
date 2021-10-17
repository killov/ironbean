import {createContext, createElement, FunctionComponent, ReactNode, useContext, useEffect, useState} from "react";
import {ApplicationContext, getBaseApplicationContext} from "ironbean";

export function useBean<T>(dependency: new (...any: any[]) => T): T {
    const componentAppContext = useContext(reactContext)
    const getContext = () => componentAppContext ?? getBaseApplicationContext();
    const [instance, setInstance] = useState<T>(() => getContext().getBean(dependency));

    useEffect(() => {
        setInstance(getContext().getBean(dependency));
    }, [componentAppContext])

    return instance;
}

const reactContext = createContext<ApplicationContext|null>(null);

interface IApplicationContextProviderProps {
    context: ApplicationContext;
    children: ReactNode;
}

export const ApplicationContextProvider: FunctionComponent<IApplicationContextProviderProps> = (props) => {
    return createElement(reactContext.Provider, {value: props.context}, props.children);
}
