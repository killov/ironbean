import {
    ApplicationContext,
    autowired,
    component,
    ComponentType,
    destroyContext,
    getBaseApplicationContext
} from "../src";
import {Container} from "../src/container";
import {containerStorage} from "../src/containerStorage";
import {createComponentContext} from "../src/api";

describe("api", () => {
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

    it("createComponentContext", () => {
        @component(ComponentType.Prototype)
        class a {
            test = "sa";
        }

        @component
        class b {
            @autowired a!: a;
        }

        const context = createComponentContext(applicationContext);

        expect(context.getBean(a)).toBe(context.getBean(a));
        expect(applicationContext.getBean(b)).toBe(context.getBean(b));
    });

});
