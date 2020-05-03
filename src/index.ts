import * as base from "./base";
import * as decorators from "./decorators";
import * as enums from "./enums";

export const ComponentType = enums.ComponentType;
export const component = decorators.component;
export const autowired = decorators.autowired;
export const dependence = decorators.dependenceKey;
export const postConstruct = decorators.postConstruct;
export const getBaseApplicationContext = base.getBaseApplicationContext;
export const getBaseTestingContext = base.getBaseTestingContext;
export const getBaseJasmineTestingContext = base.getBaseJasmineTestingContext;
export const destroyContext = base.destroyContext;

export {ApplicationContext, JasmineTestingContext, TestingContext } from "./base";


