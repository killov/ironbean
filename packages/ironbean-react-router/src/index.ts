import * as React from "react";
import {FunctionComponentElement, ReactNode, useEffect, useState} from "react";
import {ApplicationContext, component, Scope} from "ironbean";
import {ApplicationContextProvider, useBean} from "ironbean-react";
import {useHistory} from "react-router-dom";
import * as H from "history";
import {Location} from "history";

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
    public appContext: ApplicationContext;
    private last: string = "";

    constructor(appContext: ApplicationContext) {
        this.appContext = appContext;
    }

    private saveControl(state: string, path: string, control: any) {
        this.map.set(state + path, control)
    }

    private getControl(state: string, path: string): any {
        return this.map.get(state + path);
    }

    private get(resolver: Resolver, v: string, appContext: ApplicationContext, path1: string, path2: string) {
        return this.getControl(v, location.pathname) ?? resolver.getContextFromPaths(appContext, path1, path2);
    }

    listen(history: H.History<H.LocationState>, location: Location<unknown>, resolver: Resolver): ApplicationContext|undefined {
        if (history.action === "PUSH") {
            return this.push(history, location, resolver);
        }
        if (history.action === "POP") {
            return this.pop(history, location, resolver);
        }
        return undefined;
    }

    private push(history: H.History<H.LocationState>, location: Location, resolver: Resolver): ApplicationContext {
        console.log("create");
        const p1 = this.last;
        const p2 = location.pathname;
        this.last = location.pathname;

        max++;
        history.replace(location.pathname, {v: max})
        this.appContext = resolver.getContextFromPaths(this.appContext, p1, p2);

        this.saveControl(max.toString(), location.pathname, this.appContext);

        return this.appContext;
    }

    private pop(_history: H.History<H.LocationState>, location: Location, resolver: Resolver): ApplicationContext {
        const p1 = location.pathname;
        const p2 = this.last;
        this.last = location.pathname;
        // @ts-ignore
        const v = location.state?.v ?? 0;
        this.appContext = this.get(resolver, v, this.appContext, p1, p2);
        return this.appContext;
    }

    init(history: H.History<H.LocationState>, resolver: Resolver): ApplicationContext {
        // @ts-ignore
        const v = history.location.state?.v ?? 0;
        max = v;
        this.last = history.location.pathname;
        this.appContext = this.get(resolver, v, this.appContext, history.location.pathname, history.location.pathname);
        this.saveControl(v.toString(), history.location.pathname, this.appContext);
        history.replace(history.location.pathname, {v: max})

        return this.appContext;
    }
}

export function IronRouter(props: IRonRouteProps): FunctionComponentElement<IRonRouteProps> {
    const resolver = new Resolver(props.scope, props.paths);
    const cache = useBean(Storage);
    const history = useHistory();
    const [appContext, setContext] = useState(() => cache.init(history, resolver));
    useEffect(() => {
        const unSub = history.listen((location) => {
            const result = cache.listen(history, location, resolver);
            if (result !== undefined) {
                setContext(result);
            }
        });
        return () => {
            unSub();
        }
    }, []);

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
        if (this === item || this.isParent(item)) {
            if (this.parent === undefined) {
                return item;
            }
            return this.parent;
        }

        if (item.isParent(this)) {
            return this;
        }

        throw Error("asd");
    }

    public static from(scope: Scope, paths: PathItem[], path: RegExp = new RegExp("")): ResolverItem {
        return new ResolverItem(scope, paths.map(p => ResolverItem.from(p.scope, p.paths ?? [], p.path)), path);
    }
}
