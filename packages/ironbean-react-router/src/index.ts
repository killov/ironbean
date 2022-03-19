import * as React from "react";
import {FunctionComponentElement, ReactNode, useContext, useEffect, useRef} from "react";
import {ApplicationContext, component, Dependency, Scope} from "ironbean";
import {ApplicationContextProvider, useBean} from "ironbean-react";
import * as H from "history";
import {Location} from "history";
import {UNSAFE_NavigationContext, useLocation} from "react-router";
import {Scroll, useScrollRestoreManual} from "./scroll";

interface PathItem {
    scope: Scope;
    path: RegExp;
    handler?: Dependency<StateHandler>
}

interface IRonRouteProps {
    resolver: IRouterResolver;
    children: ReactNode;
}
function getVersion(location: Location) {
    return location.key;
}

interface PathContext {
    context: ApplicationContext,
    state: PathContextState
}

class PathContextState {
    private isInitialized = false;
    private readonly handler?: StateHandler;

    constructor(handler?: StateHandler) {
        this.handler = handler;
    }

    load() {
        if (this.handler !== undefined) {
            if (!this.isInitialized && this.handler.init !== undefined) {
                this.handler.init();
                this.isInitialized = true;
            }
        }
    }
}

@component
class Storage {
    private map = new Map<string, PathContext>();
    public appContext: PathContext;
    private last: string = "";
    private scroll = new Scroll();
    private scrollMap = new Map<string, number>();
    private currentNumber = "";

    constructor(appContext: ApplicationContext) {
        this.appContext = {
            context: appContext,
            state: new PathContextState()
        };
    }

    private saveControl(state: string, path: string, control: any) {
        this.map.set(state + path, control)
    }

    private getControl(state: string, path: string): PathContext|undefined {
        return this.map.get(state + path);
    }

    private get(resolver: Resolver, v: string, appContext: PathContext, path1: string, path2: string) {
        return this.getControl(v, path1) ?? resolver.getContextFromPaths(appContext, path1, path2);
    }

    listen(history: H.History, location: Location, resolver: Resolver): PathContext|undefined {
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

    private push(location: Location, resolver: Resolver): PathContext {
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

    private pop(location: Location, resolver: Resolver): PathContext {
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
        const currentv = this.currentNumber;
        console.log("save " + currentv + " " + this.scroll.get())
        this.scrollMap.set(currentv, this.scroll.get());
    }

    init(history: H.History, resolver: Resolver): PathContext {
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

function useContextByLocation(resolver: Resolver): PathContext {
    const info = useRef<Info>({
        ctx: null,
        version: null
    })
    const cache = useBean(Storage);
    const history = useHistory();
    const location = useLocation();

    if (info.current.ctx === null) {
        info.current.ctx = cache.init(history, resolver);
        info.current.version = getVersion(location);
        info.current.ctx.state.load();
    }

    if (info.current.version !== getVersion(location)) {
        info.current.version = getVersion(location);
        const ctx = cache.listen(history, location, resolver);
        if (ctx !== undefined) {
            info.current.ctx = ctx;
        }
        info.current.ctx.state.load();
    }
    return info.current.ctx;
}

interface Info {
    ctx: PathContext|null,
    version: string|null;
}

export function IronRouter(props: IRonRouteProps): FunctionComponentElement<IRonRouteProps> {
    console.log("render root")
    useScrollRestoreManual();
    const resolver = new Resolver(props.resolver);
    const cache = useBean(Storage);
    const ctx = useContextByLocation(resolver)

    useEffect(() => {
        window.setTimeout(() => {
            cache.restoreScroll();
        }, 10);
    }, [ctx.context]);

    // @ts-ignore
    return React.createElement(ApplicationContextProvider, {context: ctx.context, children: props.children});
}

interface StateHandler {
    init?(): void;
}

interface PathSettings {
    scope: Scope;
    stateHandler?: Dependency<StateHandler>
}

export interface IRouterResolver {
    getSettingsForPath(path: string): PathSettings;
}

export class RouterResolver implements IRouterResolver {
    paths: ResolverItem[];
    private constructor(paths: PathItem[]) {
        this.paths = paths.map(e => new ResolverItem(e.scope, e.path, undefined));
    }

    public static create(items: PathItem[]) {
        return new RouterResolver(items);
    }

    getSettingsForPath(path: string): PathSettings {
        for (let p of this.paths) {
            if (path.search(p.path) === 0) {
                return {
                    scope: p.scope,
                    stateHandler: p.stateHandler
                }
            }
        }
        return {
            scope: Scope.getDefault()
        }
    }
}

class Resolver {
    private resolver: IRouterResolver;
    constructor(resolver: IRouterResolver) {
        this.resolver = resolver;
    }

    private resolve(path: string): PathSettings {
        return this.resolver.getSettingsForPath(path);
    }

    public getSuper(scope1: Scope, scope2: Scope): Scope {
        const s1 = scope1.getParent() ?? Scope.getDefault();
        const s2 = scope2.getParent() ?? Scope.getDefault();

        if (s1 === s2) {
            return s1;
        }

        if (s1.isParent(s2)) {
            return s1;
        }

        return s2;
    }

    getContextFromPaths(context: PathContext, path1: string, path2: string): PathContext {
        const lastI = this.resolve(path1).scope;
        const nI = this.resolve(path2);
        const scope = this.getSuper(lastI, nI.scope);

        const newContext = context.context.createOrGetParentContext(scope).createOrGetParentContext(nI.scope)
        const handler = nI.stateHandler !== undefined ? newContext.getBean(nI.stateHandler) : undefined

        return {
            context: newContext,
            state: new PathContextState(handler)
        };
    }

}

class ResolverItem {
    public scope: Scope;
    public path: RegExp;
    public stateHandler: Dependency<StateHandler>|undefined;
    constructor(scope: Scope, path: RegExp, stateHandler: Dependency<StateHandler>|undefined) {
        this.stateHandler = stateHandler;
        this.scope = scope;
        this.path = path;
    }
}
