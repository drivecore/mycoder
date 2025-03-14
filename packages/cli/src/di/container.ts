/**
 * Simple dependency injection container
 * Manages service instances and dependencies
 */
export class Container {
  private services: Map<string, unknown> = new Map();

  /**
   * Register a service instance with the container
   * @param name Service name/key
   * @param instance Service instance
   */
  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  /**
   * Get a service instance by name
   * @param name Service name/key
   * @returns Service instance
   * @throws Error if service is not registered
   */
  get<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service '${name}' not registered in container`);
    }
    return this.services.get(name) as T;
  }

  /**
   * Check if a service is registered
   * @param name Service name/key
   * @returns True if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Remove a service from the container
   * @param name Service name/key
   * @returns True if service was removed
   */
  remove(name: string): boolean {
    return this.services.delete(name);
  }

  /**
   * Clear all registered services
   */
  clear(): void {
    this.services.clear();
  }
}

// Global container instance
let globalContainer: Container | null = null;

/**
 * Get the global container instance
 * Creates a new container if none exists
 */
export function getContainer(): Container {
  if (!globalContainer) {
    globalContainer = new Container();
  }
  return globalContainer;
}

/**
 * Reset the global container
 * Useful for testing
 */
export function resetContainer(): void {
  if (globalContainer) {
    globalContainer.clear();
  }
  globalContainer = null;
}
