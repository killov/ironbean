/** @type {import('ts-jest').JestConfigWithTsJest} */
// ES2022 target with useDefineForClassFields: true.
// TS emits `Object.defineProperty(this, "field", {value: void 0, ...})` for
// every class field. The monkey-patched Object.defineProperty intercepts those
// calls for autowired-marked fields. This is the variant SWC / modern bundlers
// produce by default - PR #67 makes sure it works even when the engine emits
// native class fields without going through Object.defineProperty.
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
          useDefineForClassFields: true,
        },
      },
    ],
  },
}
