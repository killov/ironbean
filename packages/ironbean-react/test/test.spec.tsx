import {
    ApplicationContext,
    autowired,
    component,
    destroyContext,
    getBaseApplicationContext,
    Scope,
    scope
} from "ironbean";
import React, {Component, FunctionComponent, useState} from "react";
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import {ContextProvider, useBean, withContext} from "../src";

// Compatibility helpers for React 16/17 vs React 18/19
// react-dom/test-utils is shimmed to {} for React 19 in karma.conf.js

// act: React 18.3+ exports directly from 'react', older versions use 'react-dom/test-utils'
// React 18+ requires IS_REACT_ACT_ENVIRONMENT when using act() from 'react'
const _testUtils = require('react-dom/test-utils');
const act: (callback: () => void | Promise<void>) => any = (React as any).act ?? _testUtils.act;
if ((React as any).act) {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
}

// render/unmount: React 18+ uses createRoot from react-dom/client
// For React < 18, karma.conf.js shims react-dom/client to {}, so createRoot is undefined
const { createRoot } = require('react-dom/client') as any;

let renderToContainer: (element: React.ReactElement, container: Element) => void;
let unmountFromContainer: (container: Element) => void;

if (createRoot) {
    const roots = new Map<Element, any>();
    renderToContainer = (element, container) => {
        let root = roots.get(container);
        if (!root) {
            root = createRoot(container);
            roots.set(container, root);
        }
        root.render(element);
    };
    unmountFromContainer = (container) => {
        const root = roots.get(container);
        if (root) {
            root.unmount();
            roots.delete(container);
        }
    };
} else {
    renderToContainer = (element, container) => (ReactDOM as any).render(element, container);
    unmountFromContainer = (container) => (ReactDOM as any).unmountComponentAtNode(container);
}

describe("test", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
    })

    afterEach(() => {
        destroyContext();
    });


    it("test 1", (done) => {
        const pageScope = Scope.create("pageScope");

        @component
        @scope(pageScope)
        class Page {
            @autowired context!: ApplicationContext;
        }

        const page1 = applicationContext.createOrGetParentContext(pageScope).getBean(Page);
        const page2 = applicationContext.createOrGetParentContext(pageScope).getBean(Page);

        const ChildComponent: FunctionComponent = () => {
            const page = useBean(Page);

            expect(page).toBe(page1);
            expect(page).not.toBe(page2);

            return (
                <div></div>
            );
        }

        const Top: FunctionComponent = () => {
            return (
                <ContextProvider context={page1.context}>
                    <ChildComponent />
                </ContextProvider>
            );
        }

        ReactDOMServer.renderToString(<Top />);
        done();
    });

    it("destroy container", (done) => {
        const elm = document.createElement("div");

        @component
        class Page {
            @autowired context!: ApplicationContext;
        }

        let page1 = applicationContext.getBean(Page);
        let invalidate;

        const ChildComponent: FunctionComponent = () => {
            const page = useBean(Page);
            [, invalidate] = useState(1);
            console.log(1);
            expect(page).toBe(page1);

            return (
                <div></div>
            );
        }

        const Top: FunctionComponent = () => {
            return (
                <ChildComponent />
            );
        }

        act(() => {
            renderToContainer(<Top />, elm);
        });

        destroyContext();
        page1 = getBaseApplicationContext().getBean(Page);
        invalidate(2);

        done();
    });
    let container = null;
    beforeEach(() => {
        // setup a DOM element as a render target
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        // cleanup on exiting
        unmountFromContainer(container);
        container.remove();
        container = null;
    });

    it("withAutowired", async () => {
        let currentContext: ApplicationContext;
        const scope1 = Scope.create("sc1");

        const ctx = getBaseApplicationContext();
        const ctx1 = ctx.createOrGetParentContext(scope1);
        const ctx2 = ctx.createOrGetParentContext(scope1);

        let actCtx = ctx1;

        class Comp extends Component<{}, {}> {
            @autowired
            ctx: ApplicationContext;

            render () {
                currentContext = this.ctx;

                return <></>
            }
        }
        const EComp = withContext()(Comp);

        const ref = React.createRef<Comp>();
        let reload: () => void;
        const App = (props: any) => {
            const [s, setS] = useState(1);
            reload = () => {
                setS(s+1);
            }

            return (
                <ContextProvider context={actCtx}>
                    <EComp ref={ref}/>
                </ContextProvider>
            )
        }

        await act(async () => {
            renderToContainer(<App />, container);
        });
        await wait();
        expect(currentContext).toBe(ctx1);
        expect(ref.current.ctx).toBe(ctx1);
        actCtx = ctx2;
        await act(async () => {
            reload();
        });
        expect(currentContext).toBe(ctx2);
        expect(ref.current.ctx).toBe(ctx2);

        expect(true).toBe(true);
    });

    it("withAutowired composite", async () => {
        let currentContext: ApplicationContext;
        const scope1 = Scope.create("sc1");

        const ctx = getBaseApplicationContext();
        const ctx1 = ctx.createOrGetParentContext(scope1);
        const ctx2 = ctx.createOrGetParentContext(scope1);

        let actCtx = ctx1;

        @compositeHOC
        class Comp extends Component<{}, {}> {
            @autowired
            ctx: ApplicationContext;

            render () {
                currentContext = this.ctx;

                return <></>
            }
        }
        const EComp = withContext()(Comp);

        const ref = React.createRef<Comp>();
        let reload: () => void;
        const App = (props: any) => {
            const [s, setS] = useState(1);
            reload = () => {
                setS(s+1);
            }

            return (
                <ContextProvider context={actCtx}>
                    <EComp ref={ref}/>
                </ContextProvider>
            )
        }

        await act(async () => {
            renderToContainer(<App />, container);
        });
        await wait();
        expect(currentContext).toBe(ctx1);
        //expect(ref.current.ctx).toBe(ctx1);
        actCtx = ctx2;
        await act(async () => {
            reload();
        });
        expect(currentContext).toBe(ctx2);
        //expect(ref.current.ctx).toBe(ctx2);

        expect(true).toBe(true);
    });

    it("withAutowired function component", async () => {
        let currentContext: ApplicationContext;
        const scope1 = Scope.create("sc1");

        const ctx = getBaseApplicationContext();
        const ctx1 = ctx.createOrGetParentContext(scope1);
        const ctx2 = ctx.createOrGetParentContext(scope1);

        let actCtx = ctx1;

        const Comp: React.FC<{a: number}> = (props) => {
            expect(props.a).toBe(2);
            currentContext = useBean(ApplicationContext);

            return <></>
        }
        const EComp = withContext()(Comp);

        let reload: () => void;
        const App = (props: any) => {
            const [s, setS] = useState(1);
            reload = () => {
                setS(s+1);
            }

            return (
                <ContextProvider context={actCtx}>
                    <EComp a={2} />
                </ContextProvider>
            )
        }

        await act(async () => {
            renderToContainer(<App />, container);
        });
        await wait();
        expect(currentContext).toBe(ctx1);
        actCtx = ctx2;
        await act(async () => {
            reload();
        });
        expect(currentContext).toBe(ctx2);

        expect(true).toBe(true);
    });
});

function wait(): Promise<void> {
    return new Promise((done) => {
        window.setTimeout(() => {
            done();
        }, 1);
    })
}

function compositeHOC<T extends React.ComponentClass<any>>(Comp: T): T {
    class Cp extends Component<any, any> {
        render() {
            return <Comp {...this.props} />;
        }
    }
    return Cp as any;
}
