import {component, destroyContext, getBaseTestingContext, take, TestingContext} from "../src";
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

    it ("getBeanWithMocksAsync", async () => {
        @component
        class A {

        }

        @component
        class B {
            constructor(public a: A) {
            }
        }

        //set async
        take(A).setAsyncFactory(() => Promise.resolve(new A()))

        const b1 = await testingContext.getBeanWithMocksAsync(B);
        const b2 = await testingContext.getBeanWithMocksAsync(B);


        const a = await testingContext.getMockAsync(A);

        expect(b1).toBe(b2);
        expect(b1.a).toBe(b2.a);
        expect(b1.a).toBe(a);
    });
});