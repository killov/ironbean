import {markAsOverwrittenDefineProperty} from "../src/internals";

// Detekce, jak je tento test bundle zkompilovany.
// legacy emit: this.field = 1 projde prototype setterem -> zadna own property.
// lowered define (ES2021 + useDefineForClassFields): Object.defineProperty call
//   zachyti monkeypatch pro markovane props -> prevede na set -> zadna own property.
// native emit (ES2022+ + useDefineForClassFields): [[DefineOwnProperty]] primo
//   v enginu, neda se zachytit -> vznikne own data property, ktera zastini accessor.
//   @autowired na tomto targetu nefunguje a knihovna hazi exception -> testy
//   zavisle na @autowired se pod native emitem skipuji.
export const nativeFieldEmit: boolean = (() => {
    class Probe {
        field = 1;
    }
    Object.defineProperty(Probe.prototype, "field", {
        get() { return undefined; },
        set() {},
        configurable: true,
    });
    markAsOverwrittenDefineProperty(Probe.prototype, "field");
    return Object.getOwnPropertyDescriptor(new Probe(), "field") !== undefined;
})();
