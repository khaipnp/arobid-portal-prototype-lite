declare module "bun:test" {
  type TestCallback = () => void | Promise<void>

  interface Matchers<T = unknown> {
    not: Matchers<T>
    rejects: Matchers<Awaited<T>>
    toBe(expected: unknown): void
    toBeDefined(): void
    toBeNull(): void
    toContain(expected: unknown): void
    toEqual(expected: unknown): void
    toHaveLength(expected: number): void
    toThrow(expected?: string | RegExp): void
  }

  export function describe(name: string, callback: TestCallback): void
  export function test(name: string, callback: TestCallback): void
  export function beforeEach(callback: TestCallback): void
  export function expect<T = unknown>(actual: T): Matchers<T>
}
