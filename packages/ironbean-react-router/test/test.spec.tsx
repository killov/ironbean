import { act } from "react-dom/test-utils";
import * as React from "react";
import {render, unmountComponentAtNode} from "react-dom";
import {useBean} from "ironbean-react";
import {ApplicationContext, getBaseApplicationContext, Scope} from "ironbean";
import {IronRouter, useHistory} from "../src";
import {BrowserRouter, Router} from "react-router-dom";
import * as H from "history";
import {getDefaultScope} from "ironbean/dist/scope";
import {Scroll} from "../src/scroll";

describe("router", () => {
    let container = null;
    beforeEach(() => {
        // setup a DOM element as a render target
        container = document.createElement("div");
        //container.style.height = "20000px";
        container.ad
        document.body.appendChild(container);
    });

    afterEach(() => {
        // cleanup on exiting
        unmountComponentAtNode(container);
        container.remove();
        container = null;
    });

    it("renders with or without a name", async () => {
        const scroll = new Scroll();
        const defScope = getDefaultScope();
        const scope = Scope.create("SCOPE");
        const rootContext = getBaseApplicationContext();

        let currentContext: ApplicationContext;
        var history: H.History;
        const Comp = () => {
            currentContext = useBean(ApplicationContext)
            expect(currentContext).not.toBe(rootContext)
            history = useHistory();

            return <div style={{height: 2000}}></div>
        }
        scroll.set(0);
        expect(scroll.get()).toBe(0);
        act(() => {
            render(<BrowserRouter>
                <IronRouter scope={defScope}
                    paths={[
                        {
                            scope: scope,
                            path: /.+/
                        }
                    ]}
            ><Comp /></IronRouter></BrowserRouter>, container);
        });
        await wait();
        const c1 = currentContext;
        console.log("push");
        expect(scroll.get()).toBe(0);
        scroll.set(20);
        expect(scroll.get()).toBe(20);
        history.push('/test');
        await wait();
        expect(scroll.get()).toBe(0);
        scroll.set(10);
        expect(scroll.get()).toBe(10);
        expect(currentContext).not.toBe(c1)
        const c2 = currentContext;
        console.log("back to 20")
        debugger;
        console.log("back");
        history.back();
        await wait();
        expect(scroll.get()).toBe(20);
        expect(currentContext).toBe(c1)
        console.log("forward");
        history.forward();
        await wait();
        expect(scroll.get()).toBe(10);
        expect(currentContext).toBe(c2)
        expect(history.location.pathname).toBe("/test")
        console.log("push");
        history.push('/test');
        await wait();
        expect(scroll.get()).toBe(0);
        expect(currentContext).not.toBe(c2)

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