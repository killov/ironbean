import * as React from "react";
import {FunctionComponentElement, ReactNode, useContext, useEffect, useState} from "react";
import {ApplicationContext, Scope} from "ironbean";
import {ApplicationContextProvider, useBean} from "ironbean-react";
import {useHistory, useLocation} from "react-router-dom";

interface IRonRouteProps {
    scope: Scope;
    children: ReactNode;
}

let max = 0;

class Storage {
    private map = new Map<string, any>();

    saveControl(state: string, path: string, control: any) {
        this.map.set(state + path, control)
    }

    getControl(state: string, path: string): any {
        return this.map.get(state + path);
    }
}

const CacheContext = React.createContext(new Storage());

export function IronRouter(props: IRonRouteProps): FunctionComponentElement<IRonRouteProps> {
    const cache = useContext(CacheContext);
    const context = useBean(ApplicationContext);
    let [appContext, setContext] = useState(() => context.createOrGetParentContext(props.scope));
    const location = useLocation();
    const history = useHistory();
    useEffect(() => {
        history.listen((location) => {
            console.log(location);
            console.log("action", history.action);
            if (history.action === "PUSH") {
                console.log("create");
                history.location.state

                max++;
                history.replace(history.location.pathname, {v: max})
                appContext = context.createOrGetParentContext(props.scope);

                cache.saveControl(max.toString(), location.pathname, appContext);
                setContext(appContext);
            }
            if (history.action === "POP") {
                // @ts-ignore
                const v = location.state?.v ?? 0;
                appContext = cache.getControl(v, location.pathname) ?? appContext;
                setContext(appContext);
            }
        });

        // @ts-ignore
        const v = location.state?.v ?? 0;
        max = v;
        appContext = cache.getControl(v, location.pathname) ?? appContext;
        cache.saveControl(v.toString(), location.pathname, appContext);
        history.replace(history.location.pathname, {v: max})

        setContext(appContext);
    }, []);

    console.log("redner-prov");
    // @ts-ignore
    return React.createElement(ApplicationContextProvider, {context: appContext, children: props.children});
}