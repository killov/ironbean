import {createRootAppContext, destroyContext, getRootAppContext} from "../src";
import {containerStorage} from "../src/core/containerStorage";

describe("storage", () => {
    afterEach(() => {
        expect(containerStorage.currentComponentContainer).toBe(undefined)
        containerStorage.dispose();
        destroyContext();
    });

    beforeEach(() => {
        expect(containerStorage.currentComponentContainer).toBe(undefined)
        containerStorage.dispose();
        destroyContext();
    });

    it("getBaseApplicationContext", () => {
        const ctx1 = getRootAppContext();
        const ctx2 = getRootAppContext();

        expect(ctx1).toBe(ctx2);

        expect(() => {
            createRootAppContext();
        }).toThrowError("You use getBaseApplicationContext(), don't use it in combination with createBaseApplicationContext() in the same environment.");
    });

    it("createBaseApplicationContext", () => {
        const ctx1 = createRootAppContext();
        const ctx2 = createRootAppContext();

        expect(ctx1).not.toBe(ctx2);

        expect(() => {
            getRootAppContext();
        }).toThrowError("You use createBaseApplicationContext(), don't use it in combination with getBaseApplicationContext() in the same environment.");
    });
});
