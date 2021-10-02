import * as ts from 'typescript';

export interface Options {
    mobxPackage: string;
}

const transformToMobxFlow = 'transformToMobxFlow';

/** ts-jest calls this method for their astTransformers */
export function factory() {
    return createTransformer();
}

// ts-jest config
export const name = 'ts-transform-async-to-mobx-flow';
// ts-jest config: increment this each time the code is modified
export const version = 1;

/**
 * 1. Look for functions marked as @transformToMobxFlow or transformToMobxFlow(...)
 * 2. Transform them to generator functions wrapped into mobx.flow
 * 3. Adds import to mobx.flow if there's anything transformed
 */
export default function createTransformer({
                                              mobxPackage = 'mobx',
                                          }: Partial<Options> = {}): ts.TransformerFactory<ts.SourceFile> {
    return context => file => visitSourceFile(mobxPackage, file, context);
}

function visitSourceFile(
    mobxPackage: string,
    source: ts.SourceFile,
    context: ts.TransformationContext,
): ts.SourceFile {
    let transformed = false;

    const withImport = ts.updateSourceFileNode(source, [
        ts.createImportDeclaration(
            undefined,
            undefined,
            undefined,
            ts.createLiteral('reflect-metadata')),
        ...source.statements
    ]);

    const visitor: ts.Visitor = node => {
        if (ts.isPropertyDeclaration(node)) {
            ts.createDecorator(ts.createLiteral(""))
            let node1 = ts.getMutableClone(node);

            return node1;
        }

        return ts.visitEachChild(node, visitor, context);
    };

    const result = ts.visitEachChild(withImport, visitor, context);

    if (transformed) {
        return result;
    }

    return source;
}
