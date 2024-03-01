import {createBaseApplicationContext, destroyContext, getBaseApplicationContext} from "../src";
import {containerStorage} from "../src/containerStorage";

describe("storage", () => {
    afterEach(() => {
        expect(containerStorage.currentComponentContainer).toBe(undefined, "currentComponentContainer is not clear")
        containerStorage.dispose();
        destroyContext();
    });

    beforeEach(() => {
        expect(containerStorage.currentComponentContainer).toBe(undefined, "currentComponentContainer is not clear")
        containerStorage.dispose();
        destroyContext();
    });

    it("getBaseApplicationContext", () => {
        const ctx1 = getBaseApplicationContext();
        const ctx2 = getBaseApplicationContext();

        expect(ctx1).toBe(ctx2);

        expect(() => {
            createBaseApplicationContext();
        }).toThrowError("You use getBaseApplicationContext(), don't use it in combination with createBaseApplicationContext() in the same environment.");
    });

    it("createBaseApplicationContext", () => {
        const ctx1 = createBaseApplicationContext();
        const ctx2 = createBaseApplicationContext();

        expect(ctx1).not.toBe(ctx2);

        expect(() => {
            getBaseApplicationContext();
        }).toThrowError("You use createBaseApplicationContext(), don't use it in combination with getBaseApplicationContext() in the same environment.");
    });
});
