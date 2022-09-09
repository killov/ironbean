import {
    ApplicationContext,
    component,
    ComponentContext,
    ComponentType,
    destroyContext,
    getBaseApplicationContext,
    take
} from "../src";
import {Container} from "../src/container";
import {containerStorage} from "../src/containerStorage";
import {IFactoryAsync} from "../src/types";

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

    it("getBean error async for class factory", async () => {
        class A {

        }

        class Factory implements IFactoryAsync<A> {
            createAsync(...args: any[]): Promise<A> {
                return Promise.resolve(new A);
            }
        }

        take(A).setAsyncFactory(Factory)

        expect(() => {
            const a1 = applicationContext.getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
        expect(() => {
            const a1 = applicationContext.getBean(ComponentContext).getBean(A);
        }).toThrowError("Getting bean for component Class A failed. Bean has async dependency.")
    })

    it("getBeanAsync asdsa", async () => {
        class A {

        }

        take(A).setType(ComponentType.Prototype)
        take(A).setAsyncFactory(async () => {
            return Promise.resolve(new A());
        })

        const a1 = await applicationContext.getBeanAsync(A);
        const a2 = await applicationContext.getBeanAsync(A);
        expect(a1).not.toBe(a2);

        const componentContext = applicationContext.getBean(ComponentContext);

        const a3 = await componentContext.getBeanAsync(A);
        const a4 = await componentContext.getBeanAsync(A);
        expect(a3).toBe(a4);

    })
});
