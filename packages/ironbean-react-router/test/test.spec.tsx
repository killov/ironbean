import { act } from "react-dom/test-utils";
import * as React from "react";
import {render, unmountComponentAtNode} from "react-dom";
import {useBean} from "ironbean-react";
import {ApplicationContext, getBaseApplicationContext, Scope} from "ironbean";
import {IronRouter, useHistory} from "../src";
import {BrowserRouter, Router} from "react-router-dom";
import * as H from "history";
import {getDefaultScope} from "ironbean/dist/scope";

describe("router", () => {
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

    it("renders with or without a name", async () => {
        const defScope = getDefaultScope();
        const scope = Scope.create("SCOPE");
        const rootContext = getBaseApplicationContext();

        let currentContext: ApplicationContext;
        var history: H.History;
        const Comp = () => {
            currentContext = useBean(ApplicationContext)
            console.log("render");
            if (currentContext === rootContext) {
                console.log("shit");
            }
            expect(currentContext).not.toBe(rootContext)
            history = useHistory();

            return <></>
        }

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

        history.push('/test');
        await wait();
        expect(currentContext).not.toBe(c1)
        const c2 = currentContext;
        history.back();
        await wait();
        expect(currentContext).toBe(c1)
        history.forward();
        await wait();
        expect(currentContext).toBe(c2)
        expect(history.location.pathname).toBe("/test")
        history.push('/test');
        await wait();
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