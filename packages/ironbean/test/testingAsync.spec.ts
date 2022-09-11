import {component, destroyContext, getBaseTestingContext, TestingContext} from "../src";
import {Container} from "../src/container";

describe("testing", () => {
    let testingContext: TestingContext;

    beforeEach(() => {
        testingContext = getBaseTestingContext();
        expectDependenciesCount(2);
    })

    afterEach(() => {
        destroyContext();
    });

    function expectDependenciesCount(dependenciesCount: number) {
        expect(testingContext.getBean(Container).countOfDependencies()).toBe(dependenciesCount + 1);
    }

    it ("setMockAsyncFactory must be async component error", () => {
        @component
        class A {

        }

        expect(() => {
            testingContext.setMockAsyncFactory(A, async () => {
                return Promise.resolve(new A());
            })
        }).toThrowError("Component Class A is not async.")
    });
});