// Global library settings.
export const ironbeanSettings = {
    /**
     * Allows inject()/inject.lazy() in classes that are not created by the container.
     * The dependency is resolved from the base container, same as @autowired did
     * for plain classes. Migration path from deprecated @autowired.
     */
    allowInjectOutsideComponent: false
};
