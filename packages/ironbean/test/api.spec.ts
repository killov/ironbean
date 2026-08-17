import {
    ApplicationContext,
    autowired,
    component,
    ComponentContext,
    ComponentType, createBaseApplicationContext,
    destroyContext,
    getBaseApplicationContext,
    inject
} from "../src";
import {Container} from "../src/container";
import {nativeFieldEmit} from "./emitMode";
import {containerStorage} from "../src/containerStorage";
import {createComponentContext, IPlugin, registerPlugin} from "../src/api";

const itAutowired = nativeFieldEmit ? it.skip : it;

describe("api", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
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

    itAutowired("createComponentContext", () => {
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

    it("createComponentContext - inject", () => {
        @component(ComponentType.Prototype)
        class a {
            test = "sa";
        }

        @component
        class b {
            a = inject.lazy(a);
        }

        const context = createComponentContext(applicationContext);

        expect(context.getBean(a)).toBe(context.getBean(a));
        expect(applicationContext.getBean(b)).toBe(context.getBean(b));
    });

    itAutowired("plugin getContextForClassInstance", () => {
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

    itAutowired("plugins for prototype storage mode", () => {
        containerStorage.dispose();

        applicationContext = createBaseApplicationContext();
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

    it("plugin registered before base container is created stays active", () => {
        // ironbean-react registruje plugin pri importu modulu, drive nez existuje container
        containerStorage.dispose();
        destroyContext();

        @component
        class Plugin implements IPlugin {
            getContextForClassInstance(): ComponentContext | undefined {
                return undefined;
            }
        }

        registerPlugin(Plugin);

        // vytvoreni base containeru az po registraci nesmi plugin zahodit
        const context = getBaseApplicationContext();

        expect(containerStorage.plugins.length).toBe(1);
        expect(context.getBean(Plugin)).toBe(context.getBean(Plugin));
    });

});
