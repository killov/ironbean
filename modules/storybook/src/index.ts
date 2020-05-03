import {destroyContext, getBaseTestingContext, TestingContext} from "fire-dic";
import {addDecorator} from "@storybook/react";

type TOnInit = (context: TestingContext) => void;

export let onI: TOnInit | undefined;

export function onInitStory(onInit: TOnInit) {
    addDecorator((fn, c) => {
        destroyContext();
        onI = onInit;
        start();
        return fn(c);
    })
}

export function start() {
    if (onI) {
        const context = getBaseTestingContext();
        onI(context);
    }
}