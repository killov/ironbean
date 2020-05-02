import addons from "@storybook/addons";
import {destroyContext} from "fire-dic";

addons.register("fire-dic", (api) => {
    api.onStory(() => {
        destroyContext();
    });
});
