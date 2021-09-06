import {ScopeType} from "./internals";

export interface Scope {
    createScope(name: string, type?: ScopeType): Scope;
}

export class ScopeImpl implements Scope {
    private static idCounter = 0;
    private readonly id = ScopeImpl.idCounter++;
    private readonly parent: ScopeImpl|null;
    private readonly name: string;
    private readonly type: ScopeType;

    constructor(name: string, type: ScopeType, parent: ScopeImpl|null = null) {
        this.parent = parent;
        this.type = type;
        this.name = name;
    }

    createScope(name: string, type: ScopeType = ScopeType.Prototype): Scope {
        return new ScopeImpl(name, type, this);
    }

    getParent(): ScopeImpl|null {
        return this.parent;
    }

    getAllParents(): ScopeImpl[] {
        const parent = this.getParent();
        return parent === null ? [this] : [this, ...parent.getAllParents()];
    }

    getType(): ScopeType {
        return this.type;
    }

    getId(): number {
        return this.id;
    }

    getDirectChildFor(scope: ScopeImpl): ScopeImpl {
        const parent = scope.getParent()
        if (parent === null) {
            throw new Error();
        }
        return this === parent ? scope : this.getDirectChildFor(parent);
    }

    toString(): string {
        return this.parent ? this.parent.toString() + "." + this.name : this.name;
    }

    static getCommonParent(scope1: ScopeImpl, scope2: ScopeImpl): ScopeImpl {
        const parents = scope1.getAllParents();
        let parent: ScopeImpl|null = scope2;

         do {
            const index = parents.indexOf(parent);
            if (index !== -1) {
                return parents[index];
            }
        } while(parent = parent.getParent());

        throw new Error();
    }
}

const defaultScope = new ScopeImpl("DEFAULT", ScopeType.Singleton);

export function getDefaultScope(): Scope {
    return defaultScope;
}