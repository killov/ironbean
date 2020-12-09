import {
    ApplicationContext,
    autowired,
    component,
    destroyContext,
    getBaseApplicationContext,
    getDefaultScope,
    scope
} from "fire-dic";
import React, {FunctionComponent} from "react";
import ReactDOMServer from 'react-dom/server';
import {ApplicationContextProvider, useBean} from "../src";

describe("test", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
    })

    afterEach(() => {
        destroyContext();
    });


    it("test 1", (done) => {
        const pageScope = getDefaultScope().createScope("pageScope");

        @component
        @scope(pageScope)
        class Page {
            @autowired context!: ApplicationContext;
        }

        const page1 = applicationContext.getBean(Page);
        const page2 = applicationContext.getBean(Page);

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
});