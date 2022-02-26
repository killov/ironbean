import React, {
    Component,
    createContext,
    createElement,
    forwardRef,
    FunctionComponent,
    ReactNode,
    useContext,
    useEffect,
    useState
} from "react";
import {ApplicationContext, Dependency, getBaseApplicationContext} from "ironbean";
import {IPlugin, registerPlugin} from "ironbean/dist/api";
import {ComponentContainer} from "ironbean/dist/componentContainer";
import {Container} from "ironbean/dist/container";

export function useBean<T>(dependency: Dependency<T>): T {
    const componentAppContext = useContext(reactContext)
    const getContext = () => componentAppContext ?? getBaseApplicationContext();
    let [instance, setInstance] = useState<T>(() => getContext().getBean(dependency));

    useEffect(() => {
        instance = getContext().getBean(dependency);
        setInstance(instance);
    }, [componentAppContext])

    return instance;
}

const reactContext = createContext<ApplicationContext|null>(null);

interface IContextProviderProps {
    context: ApplicationContext;
    children: ReactNode;
}

export const ContextProvider: FunctionComponent<IContextProviderProps> = (props) => {
    return createElement(reactContext.Provider, {value: props.context}, props.children);
}

const contextPropName = "0ironbeancontext";
const contextStateSymbol = Symbol();

interface ContextState {
    context: ApplicationContext;
    componentContext: ComponentContainer
}

class Plugin implements IPlugin {
    getComponentContainerForClassInstance(Class: any): ComponentContainer | undefined {
        if (!(Class instanceof Component)) {
            return undefined;
        }

        if (Class.props[contextPropName] === undefined) {
            return undefined;
        }
        const state = Plugin.getState(Class as any);

        return state.componentContext
    }

    private static getState(Class: Component): ContextState {
        let state: ContextState | undefined = Class[contextStateSymbol];
        if (state === undefined || state?.context !== Class.props[contextPropName]) {
            const context = Class.props[contextPropName];
            const newState: ContextState  = {
                context: context,
                componentContext: new ComponentContainer(context.getBean(Container))
            }
            Object.defineProperty(Class, contextStateSymbol, {
                value: newState,
                configurable: true
            });

            return newState;
        }
        return state;
    }
}

registerPlugin(new Plugin());

export function withAutowired(): <T extends React.ComponentClass<any>>(component: T) => T {
    return <T extends React.ComponentClass<P>, P>(component: T) => {
        // @ts-ignore
        class b extends component {}

        return forwardRef((props, ref) => {
            const context = useBean(ApplicationContext);
            const p = {...props, ref} as any;
            p[contextPropName] = context;
            return React.createElement(b as any, p);
        }) as any;
    }
}

