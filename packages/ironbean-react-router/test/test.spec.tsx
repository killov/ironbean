import { act } from "react-dom/test-utils";
import * as React from "react";
import {render, unmountComponentAtNode} from "react-dom";
import {useBean} from "ironbean-react";
import {ApplicationContext, Scope} from "ironbean";
import {IronRouter} from "../src";
import {BrowserRouter, Router} from "react-router-dom";

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

    it("renders with or without a name", () => {
        const scope = Scope.create("SCOPE");

        let currentContext: ApplicationContext;
        const Comp = () => {
            currentContext = useBean(ApplicationContext)

            return <></>
        }

        act(() => {
            render(<BrowserRouter><IronRouter scope={scope}><Comp /></IronRouter></BrowserRouter>, container);
        });

        expect(true).toBe(true);
    });

});