import {Async, component, destroyContext, getBaseTestingContext, take, type, TestingContext} from "../src";
import {DependencyToken} from "../src/dependencyToken";
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

    it ("setMockAsyncFactory on async token without production factory", async () => {
        class A {}

        const token = DependencyToken.createAsync<A>("tokenA");

        testingContext.setMockAsyncFactory(token, async () => new A());

        const a = await testingContext.getMockAsync(token);
        expect(a instanceof A).toBe(true);
    });

    it ("getMockAsync on async token returns automatic mock", async () => {
        interface ITodoStorage {
            save(): void;
        }

        const token = DependencyToken.createAsync<ITodoStorage>("tokenD");

        const mock = await testingContext.getMockAsync(token);

        expect(mock).toBeDefined();
        expect(() => mock.save()).not.toThrow();
    });

    it ("automatic mock of async token injected into async component", async () => {
        interface ITodoStorage {
            save(): void;
        }

        const token = DependencyToken.createAsync<ITodoStorage>("tokenE");

        @component
        class TodoList extends Async {
            constructor(@type(token) public storage: ITodoStorage) {
                super();
            }
        }

        const list = await testingContext.getBeanWithMocksAsync(TodoList);

        expect(list.storage).toBe(await testingContext.getMockAsync(token));
    });

    it ("async token is async before its factory is registered", () => {
        class A {}

        const token = DependencyToken.createAsync<A>("tokenB");

        expect(() => {
            testingContext.getBean(token);
        }).toThrowError("Getting bean for component tokenB failed. Bean has async dependency.");

        take(token).setAsyncFactory(async () => new A());

        expect(() => {
            testingContext.getBean(token);
        }).toThrowError("Getting bean for component tokenB failed. Bean has async dependency.");
    });

    it ("getBeanWithMocksAsync", async () => {
        @component
        class A extends Async {

        }

        @component
        class B extends Async {
            constructor(public a: A) {
                super();
            }
        }

        //set async
        take(A).setAsyncFactory(() => Promise.resolve(new A()))
        take(B).setAsyncFactory(async (ctx) => new B(await ctx.getBeanAsync(A)))

        const b1 = await testingContext.getBeanWithMocksAsync(B);
        const b2 = await testingContext.getBeanWithMocksAsync(B);


        const a = await testingContext.getMockAsync(A);

        expect(b1).toBe(b2);
        expect(b1.a).toBe(b2.a);
        expect(b1.a).toBe(a);
    });
});
