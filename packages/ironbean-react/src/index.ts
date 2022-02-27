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
import {ApplicationContext, component, ComponentContext, Dependency, getBaseApplicationContext} from "ironbean";
import {createComponentContext, IPlugin, registerPlugin} from "ironbean/dist/api";

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
    componentContext: ComponentContext
}

@component
class Plugin implements IPlugin {
    getContextForClassInstance(Class: object): ComponentContext | undefined {
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
        // @ts-ignore
        const state: ContextState | undefined = Class[contextStateSymbol];
        // @ts-ignore
        if (state === undefined || state?.context !== Class.props[contextPropName]) {
            // @ts-ignore
            const context = Class.props[contextPropName];
            const newState: ContextState  = {
                context: context,
                componentContext: createComponentContext(context)
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

registerPlugin(Plugin);

export function withContext(): <T extends React.ComponentClass<any>>(component: T) => T {
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

