import * as base from "./base";
import * as decorators from "./decorators";
import * as componentConfig from "./componentConfig";
import * as scopeM from "./scope";
import * as enums from "./enums";
import * as dependencyKey from "./dependencyToken";

export const ComponentType = enums.ComponentType;
export const ScopeType = enums.ScopeType;
export const component = decorators.component;
export const autowired = decorators.autowired;
export const type = decorators.type;
export const postConstruct = decorators.postConstruct;
export const scope = decorators.scope;
export const getBaseApplicationContext = base.getBaseApplicationContext;
export const getBaseTestingContext = base.getBaseTestingContext;
export const destroyContext = base.destroyContext;

export const take = componentConfig.take;

export const getDefaultScope = scopeM.getDefaultScope;
export const DependencyToken = dependencyKey.DependencyToken;

export {ApplicationContext, ComponentContext, TestingContext } from "./base";


