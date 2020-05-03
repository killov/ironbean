import {getBaseTestingContext, TestingContext} from "fire-dic";

type TOnInit = (context: TestingContext) => void;

export let onI: TOnInit | undefined;

export function onInitStory(onInit: TOnInit) {
    onI = onInit;
    start();
}

export function start() {
    if (onI) {
        const context = getBaseTestingContext();
        onI(context);
    }
}