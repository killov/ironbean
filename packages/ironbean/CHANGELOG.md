# ironbean

## 2.0.0
rename getBaseApplicationContext() to getRootAppContext()
rename createBaseApplicationContext() to createRootAppContext()
rename getBaseTestingContext() to getRootTestingContext()

## 1.0.21
fixes for E6 environment

## 1.0.20
upgrade typescript to 4.9

## 1.0.19
inject(type) function
inject.lazy(type) function

## 1.0.18
reflect-metadata@0.2.1

## 1.0.17
plugins bug fixed

## 1.0.16
support abstract classes

## 1.0.15
createBaseApplicationContext

## 1.0.14
Fixed is class factory predicate

## 1.0.13
Support parameter decorator for constructor

## 1.0.12
Testing - enable automock for class component after mark by enableMock()

## 1.0.11
Fixed lazy component postConstruct useless call
Fixed @type decorator for a build that does not support emit decorator metadata

## 1.0.1O
Documentation

## 1.0.9
Documentation

## 1.0.8
- Dependency tokens over class extend
- preparation code splitting for testing
- preparation code for async dependencies
- take setClassType() for automocking in testing
- automocking for dependency tokens over class extend

## 1.0.7
- Scope.getDefault()
- Scope.isParent(scope: Scope)

## 1.0.6
- API - registerPlugin
- API - createComponentContext
- take clear method

## 1.0.5
- storing data only for component
- scope type removed
- collection components
- lazy collection components
- lazy collection components for constructor
- load plugins from container

## 1.0.4
- set mock factory without component
- autowired cache fix
- unknown dependency mock
- support DependencyToken for useBean

## 1.0.3
- support @lazy for @autowired
- createOrGetParentContext method on context

## 1.0.2

- fix @type decorator
- constructor @lazy support
- circular dependency check
- @type allow dependency token in callback

## 1.0.1

- component performance
- scopes refactor
