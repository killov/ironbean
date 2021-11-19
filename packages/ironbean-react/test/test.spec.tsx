import {
    ApplicationContext,
    autowired,
    component,
    destroyContext,
    getBaseApplicationContext,
    Scope,
    scope
} from "ironbean";
import React, {FunctionComponent, useState} from "react";
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import {ApplicationContextProvider, useBean} from "../src";
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
                <ApplicationContextProvider context={page1.context}>
                    <ChildComponent />
                </ApplicationContextProvider>
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
            console.log(page);
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
});
