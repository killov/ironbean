export abstract class Scope {
    public static create(name: string): Scope {
        return defaultScope.createScope(name);
    }
    abstract createScope(name: string): Scope;

    abstract getParent(): Scope|null;

    abstract isParent(scope: Scope): boolean;

    static getDefault(): Scope {
        return defaultScope;
    }
}

export class ScopeImpl extends Scope {
    private readonly parent: ScopeImpl|null;
    private readonly name: string;

    constructor(name: string, parent: ScopeImpl|null = null) {
        super();
        this.parent = parent;
        this.name = name;
    }

    createScope(name: string): Scope {
        return new ScopeImpl(name, this);
    }

    getParent(): ScopeImpl|null {
        return this.parent;
    }

    isParent(scope: ScopeImpl): boolean {
        return this.parent === scope || (this.parent?.isParent(scope) ?? false);
    }

    getAllParents(): ScopeImpl[] {
        const parent = this.getParent();
        return parent === null ? [this] : [this, ...parent.getAllParents()];
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

    static getDefault(): ScopeImpl {
        return defaultScope;
    }
}

const defaultScope = new ScopeImpl("DEFAULT");