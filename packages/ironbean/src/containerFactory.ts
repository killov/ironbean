import {component, Container, ScopeImpl} from "./internals";

@component
export class ContainerFactory {
    create(parent: Container|null = null, scope: ScopeImpl|null = null): Container {
        return new Container(parent, scope);
    }
}