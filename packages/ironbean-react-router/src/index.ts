import * as React from "react";
import {FunctionComponentElement, ReactNode, useEffect, useRef, useState} from "react";
import {ApplicationContext, component, Scope} from "ironbean";
import {ApplicationContextProvider, useBean} from "ironbean-react";
import {useHistory, useLocation} from "react-router-dom";

interface PathItem {
    scope: Scope;
    path: RegExp;
    paths?: PathItem[]
}

interface IRonRouteProps {
    scope: Scope;
    paths: PathItem[]
    children: ReactNode;
}

let max = 0;

@component
class Storage {
    private map = new Map<string, any>();

    saveControl(state: string, path: string, control: any) {
        this.map.set(state + path, control)
    }

    getControl(state: string, path: string): any {
        return this.map.get(state + path);
    }
}

export function IronRouter(props: IRonRouteProps): FunctionComponentElement<IRonRouteProps> {
    const resolver = new Resolver(props.scope, props.paths);
    const cache = useBean(Storage);
    const context = useBean(ApplicationContext);
    let [appContext, setContext] = useState(() => context.createOrGetParentContext(props.scope));
    const location = useLocation();
    const last = useRef(location.pathname);
    const history = useHistory();
    useEffect(() => {
        history.listen((location) => {
            console.log(location);
            console.log("action", history.action);
            if (history.action === "PUSH") {
                console.log("create");
                const p1 = last.current;
                const p2 = location.pathname;
                last.current = location.pathname;

                max++;
                history.replace(location.pathname, {v: max})
                appContext = resolver.getContextFromPaths(context, p1, p2);

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

class Resolver {
    item: ResolverItem;
    constructor(scope: Scope, paths: PathItem[]) {
        this.item = ResolverItem.from(scope, paths)
    }

    resolve(path: string): ResolverItem {
        return this.resolveInternal(path, this.item.items, this.item);
    }

    getContextFromPaths(context: ApplicationContext, path1: string, path2: string): ApplicationContext {
        const lastI = this.resolve(path1);
        const nI = this.resolve(path2);
        const scope = lastI.getSuper(nI).scope

        return context.createOrGetParentContext(scope).createOrGetParentContext(nI.scope);
    }

    private resolveInternal(path: string, paths: ResolverItem[], scope: ResolverItem): ResolverItem {
        for (let p of paths) {
            if (path.search(p.path) === 0) {
                return this.resolveInternal(path.replace(p.path, ""), p.items, p)
            }
        }
        return scope;
    }
}

class ResolverItem {
    private parent?: ResolverItem;
    public scope: Scope;
    public path: RegExp;
    public items: ResolverItem[];
    constructor(scope: Scope, items: ResolverItem[], path: RegExp) {
        this.scope = scope;
        this.items = items;
        this.path = path;

        items.forEach(i => {
            i.parent = this;
        })
    }

    public isParent(item: ResolverItem): boolean {
        return this.parent === item || (this.parent?.isParent(item) ?? false);
    }

    public getSuper(item: ResolverItem): ResolverItem {
        if (this === item) {
            if (this.parent === undefined) {
                return item;
            }
            return this.parent;
        }

        if (item.isParent(this)) {
            return this;
        }

        if (this.isParent(item)) {
            return item;
        }
        throw Error("asd");
    }

    public static from(scope: Scope, paths: PathItem[], path: RegExp = new RegExp("")): ResolverItem {
        return new ResolverItem(scope, paths.map(p => ResolverItem.from(p.scope, p.paths ?? [], p.path)), path);
    }
}
