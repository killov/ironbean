import * as base from "./base";
import * as decorators from "./decorators";
import * as scopeM from "./scope";
import * as enums from "./enums";

export const ComponentType = enums.ComponentType;
export const ScopeType = enums.ScopeType;
export const component = decorators.component;
export const autowired = decorators.autowired;
export const dependence = decorators.dependenceKey;
export const postConstruct = decorators.postConstruct;
export const scope = decorators.scope;
export const getBaseApplicationContext = base.getBaseApplicationContext;
export const getBaseTestingContext = base.getBaseTestingContext;
export const destroyContext = base.destroyContext;

export const getDefaultScope = scopeM.getDefaultScope;

export {ApplicationContext, TestingContext } from "./base";


