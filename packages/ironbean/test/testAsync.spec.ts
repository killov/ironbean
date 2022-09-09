import {
    ApplicationContext,
    autowired,
    collection,
    component,
    ComponentContext,
    ComponentType,
    DependencyToken,
    destroyContext,
    getBaseApplicationContext,
    IFactory,
    lazy,
    needScope,
    postConstruct,
    provideScope,
    Scope,
    scope,
    take,
    type
} from "../src";
import {Container} from "../src/container";
import {containerStorage} from "../src/containerStorage";

describe("test async", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
        expectDependenciesCount(2);
    })

    afterEach(() => {
        expect(containerStorage.currentComponentContainer).toBe(undefined, "currentComponentContainer is not clear")
        destroyContext();
    });

    function expectDependenciesCount(dependenciesCount: number) {
        expect(applicationContext.getBean(Container).countOfDependencies()).toBe(dependenciesCount);
    }

    it("getBeanAsync", async () => {
        @component
        class A {

        }

        const a1 = await applicationContext.getBeanAsync(A);
        const a2 = await applicationContext.getBeanAsync(A);
        expect(a1).toBe(a2);
    })

    it("getBean error async", async () => {
        class A {

        }

        take(A).setAsyncFactory(async () => {
            return Promise.resolve(new A());
        })

        expect(() => {
            const a1 = applicationContext.getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
        expect(() => {
            const a1 = applicationContext.getBean(ComponentContext).getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")

    })
});
