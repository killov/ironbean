import { act } from "react-dom/test-utils";
import * as React from "react";
import {render, unmountComponentAtNode} from "react-dom";
import {useBean} from "ironbean-react";
import {ApplicationContext, Scope} from "ironbean";
import {IronRouter} from "../src";
import {BrowserRouter, Router, useHistory} from "react-router-dom";
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

        let currentContext: ApplicationContext;
        var history: H.History;
        const Comp = () => {
            currentContext = useBean(ApplicationContext)
            history = useHistory();
            console.log("render");

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
        history.goBack();
        await wait();
        expect(currentContext).toBe(c1)
        history.goForward();
        await wait();
        expect(currentContext).toBe(c2)

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