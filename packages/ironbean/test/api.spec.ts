import {
    ApplicationContext,
    autowired,
    component,
    ComponentContext,
    ComponentType,
    createRootAppContext,
    destroyContext,
    getRootAppContext
} from "../src";
import {Container} from "../src/core/container";
import {containerStorage} from "../src/core/containerStorage";
import {createComponentContext, IPlugin, registerPlugin} from "../src/api";

describe("api", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getRootAppContext();
        expectDependenciesCount(2);
    })

    afterEach(() => {
        expect(containerStorage.currentComponentContainer).toBe(undefined)
        containerStorage.dispose();
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

    it("plugin getContextForClassInstance", () => {
        @component
        class Plugin implements IPlugin {
            componentContext: ComponentContext;

            constructor(context: ApplicationContext) {
                this.componentContext = createComponentContext(context)
            }

            getContextForClassInstance(Class: object): ComponentContext | undefined {
                return this.componentContext;
            }
        }

        registerPlugin(Plugin);

        @component(ComponentType.Prototype)
        class a {
            test = "sa";
        }

        @component(ComponentType.Prototype)
        class b {
            @autowired a!: a;
        }

        expect(applicationContext.getBean(b).a).toBe(applicationContext.getBean(b).a);
    });

    it("plugins for prototype storage mode", () => {
        containerStorage.dispose();

        applicationContext = createRootAppContext();
        @component
        class Plugin implements IPlugin {
            componentContext: ComponentContext;

            constructor(context: ApplicationContext) {
                this.componentContext = createComponentContext(context)
            }

            getContextForClassInstance(Class: object): ComponentContext | undefined {
                return this.componentContext;
            }
        }

        registerPlugin(Plugin);

        @component(ComponentType.Prototype)
        class a {
            test = "sa";
        }

        @component(ComponentType.Prototype)
        class b {
            @autowired a!: a;
        }

        expect(applicationContext.getBean(b).a).toBe(applicationContext.getBean(b).a);
    });

});
