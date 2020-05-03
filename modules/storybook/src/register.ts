import addons from "@storybook/addons";
import {destroyContext} from "fire-dic";
import {start} from "./index";

addons.register("fire-dic", (api) => {
    api.onStory(() => {
        destroyContext();
        start();
    });
});
