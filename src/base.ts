import {Container, getBaseContainer} from "./container";
import {ComponentType} from "./enums";
import {autowired, component} from "./decorators";

(function() {
    if (typeof (Object as any).id === "undefined") {
        let id = 0;

        (Object as any).id = function(o: any) {
            if (typeof o.__uniqueid === "undefined") {
                Object.defineProperty(o, "__uniqueid", {
                    value: ++id,
                    enumerable: false,
                    writable: false
                });
            }

            return o.__uniqueid;
        };
    }
})();

@component(ComponentType.Singleton)
export class ApplicationContext {
    @autowired private container!: Container;
    public getBean<T>(Class: new (...any: any[]) => T): T {
        return this.container.getDependency(Class);
    }
}

export function getBaseApplicationContext(): ApplicationContext {
    const container = getBaseContainer();
    return container.getDependency(ApplicationContext);
}

