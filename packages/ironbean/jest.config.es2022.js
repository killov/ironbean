/** @type {import('ts-jest').JestConfigWithTsJest} */
// ES2022 target with legacy class-field emit (useDefineForClassFields: false).
// In this mode `field = void 0` is emitted as plain assignment - the prototype
// setter (no-op for autowired) absorbs it; accessor on prototype remains.
module.exports = {
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          importHelpers: true,
          strict: false,
          strictPropertyInitialization: false,
          noUnusedLocals: false,
          noImplicitAny: false,
          noUnusedParameters: false,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          target: "ES2022",
          useDefineForClassFields: false,
        },
      },
    ],
  },
}
