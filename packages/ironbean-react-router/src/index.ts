import * as React from "react";
import {FunctionComponentElement, ReactNode, useContext, useEffect, useRef} from "react";
import {ApplicationContext, component, Scope} from "ironbean";
import {ApplicationContextProvider, useBean} from "ironbean-react";
import * as H from "history";
import {Location} from "history";
import {UNSAFE_NavigationContext, useLocation} from "react-router";
import {Scroll} from "./scroll";

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
function getVersion(location: Location) {
    return location.key;
}

@component
class Storage {
    private map = new Map<string, any>();
    public appContext: ApplicationContext;
    private last: string = "";
    private scroll = new Scroll();
    private scrollMap = new Map<string, number>();
    private currentNumber = "";

    constructor(appContext: ApplicationContext) {
        this.appContext = appContext;
        window.history.scrollRestoration = "manual"
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

    listen(history: H.History, location: Location, resolver: Resolver): ApplicationContext|undefined {
        if (history.action === "PUSH" || history.action === "REPLACE") {
            return this.push(location, resolver);
        }
        if (history.action === "POP") {
            return this.pop(location, resolver);
        }
        return undefined;
    }

    restoreScroll() {
        const v = this.currentNumber;
        console.log("restore " + v  + " " + this.scrollMap.get(v) ?? 0)
        this.scroll.set(this.scrollMap.get(v) ?? 0);
    }

    private push(location: Location, resolver: Resolver): ApplicationContext {
        console.log("create");
        const p1 = this.last;
        const p2 = location.pathname;
        this.last = location.pathname;

        this.save();

        this.scroll.scrollTop();
        const v = getVersion(location);
        this.appContext = resolver.getContextFromPaths(this.appContext, p1, p2);

        this.saveControl(v.toString(), location.pathname, this.appContext);
        this.currentNumber = v;

        return this.appContext;
    }

    private pop(location: Location, resolver: Resolver): ApplicationContext {
        const p1 = location.pathname;
        const p2 = this.last;
        this.last = location.pathname;
        this.save();
        const v = getVersion(location);
        this.appContext = this.get(resolver, v, this.appContext, p1, p2);
        this.currentNumber = v;
        return this.appContext;
    }

    private save() {
        // @ts-ignore
        const currentv = this.currentNumber;
        console.log("save " + currentv + " " + this.scroll.get())
        this.scrollMap.set(currentv, this.scroll.get());
    }

    init(history: H.History, resolver: Resolver): ApplicationContext {
        const v = getVersion(history.location);
        this.last = history.location.pathname;
        this.appContext = this.get(resolver, v, this.appContext, history.location.pathname, history.location.pathname);
        this.saveControl(v.toString(), history.location.pathname, this.appContext);
        this.currentNumber = v;

        return this.appContext;
    }
}

export function useHistory(): H.History {
    const nav = useContext(UNSAFE_NavigationContext);
    return nav.navigator as any as H.History;
}

function useContextByLocation(resolver: Resolver): ApplicationContext {
    const info = useRef<Info>({
        ctx: null,
        version: null
    })
    const cache = useBean(Storage);
    const history = useHistory();
    const location = useLocation();

    if (info.current.ctx === null) {
        info.current.ctx = cache.init(history, resolver);
    }

    if (info.current.version !== getVersion(location)) {
        info.current.version = getVersion(location);
        const ctx = cache.listen(history, location, resolver);
        if (ctx !== undefined) {
            info.current.ctx = ctx;
        }
    }
    return info.current.ctx;
}

interface Info {
    ctx: ApplicationContext|null,
    version: string|null;
}

export function IronRouter(props: IRonRouteProps): FunctionComponentElement<IRonRouteProps> {
    console.log("render root")
    const resolver = new Resolver(props.paths);
    const cache = useBean(Storage);
    const ctx = useContextByLocation(resolver);

    useEffect(() => {
        window.setTimeout(() => {
            cache.restoreScroll();
        }, 10);
    }, [ctx]);

    // @ts-ignore
    return React.createElement(ApplicationContextProvider, {context: ctx, children: props.children});
}

class Resolver {
    paths: ResolverItem[];
    constructor(paths: PathItem[]) {
        this.paths = paths.map(e => ResolverItem.from(e.scope, e.path));
    }

    private resolve(path: string): ResolverItem {
        return this.resolveInternal(path);
    }

    public getSuper(scope1: Scope, scope2: Scope): Scope {
        if (scope1 === scope2 || scope1.isParent(scope2)) {
            if (scope1 === Scope.getDefault()) {
                return scope2;
            }
            return scope1.getParent()!;
        }

        if (scope2.isParent(scope1)) {
            return scope1;
        }

        throw Error("asd");
    }

    getContextFromPaths(context: ApplicationContext, path1: string, path2: string): ApplicationContext {
        const lastI = this.resolve(path1);
        const nI = this.resolve(path2);
        const scope = this.getSuper(lastI.scope, nI.scope);

        return context.createOrGetParentContext(scope).createOrGetParentContext(nI.scope);
    }

    private resolveInternal(path: string): ResolverItem {
        for (let p of this.paths) {
            if (path.search(p.path) === 0) {
                return p;
            }
        }
        return ResolverItem.from(Scope.getDefault());
    }
}

class ResolverItem {
    public scope: Scope;
    public path: RegExp;
    constructor(scope: Scope, path: RegExp) {
        this.scope = scope;
        this.path = path;
    }

    public isParent(item: ResolverItem): boolean {
        return this.scope.isParent(item.scope);
    }

    public static from(scope: Scope, path: RegExp = new RegExp("")): ResolverItem {
        return new ResolverItem(scope, path);
    }
}
