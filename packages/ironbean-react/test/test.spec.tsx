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
import ReactDOM, {render, unmountComponentAtNode} from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import {ContextProvider, useBean, withAutowired} from "../src";
import {act} from "react-dom/test-utils";

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
            ReactDOM.render(<Top />, elm);
        });

        destroyContext();
        invalidate(2);
        page1 = applicationContext.getBean(Page);

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
        unmountComponentAtNode(container);
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
        const EComp = withAutowired()(Comp);

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

        act(() => {
            render(<App />, container);
        });
        await wait();
        expect(currentContext).toBe(ctx1);
        expect(ref.current.ctx).toBe(ctx1);
        actCtx = ctx2;
        reload();
        await wait();
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
        const EComp = withAutowired()(Comp);

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

        act(() => {
            render(<App />, container);
        });
        await wait();
        expect(currentContext).toBe(ctx1);
        //expect(ref.current.ctx).toBe(ctx1);
        actCtx = ctx2;
        reload();
        await wait();
        expect(currentContext).toBe(ctx2);
        //expect(ref.current.ctx).toBe(ctx2);

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