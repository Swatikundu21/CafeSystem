/**
 * Test Runner Harness
 * 
 * Executes White-box & Black-box Unit Tests in-browser and headless.
 * Records test suite results, assertions, durations, and diagnostic traces.
 */

export interface TestAssertion {
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  errorMessage?: string;
}

export interface TestCaseResult {
  id: string;
  jiraKey?: string;
  name: string;
  suite: string;
  passed: boolean;
  durationMs: number;
  assertions: TestAssertion[];
  error?: string;
}

export interface TestSuiteResult {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  tests: TestCaseResult[];
}

export class AssertionContext {
  public assertions: TestAssertion[] = [];

  public expect(actual: unknown, description: string) {
    return {
      toBe: (expected: unknown) => {
        const passed = actual === expected;
        this.assertions.push({
          description,
          passed,
          expected,
          actual,
          errorMessage: passed ? undefined : `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
        });
      },
      toEqual: (expected: unknown) => {
        const passed = JSON.stringify(actual) === JSON.stringify(expected);
        this.assertions.push({
          description,
          passed,
          expected,
          actual,
          errorMessage: passed ? undefined : `Deep equality mismatch. Expected: ${JSON.stringify(expected)}`,
        });
      },
      toBeCloseTo: (expected: number, delta: number = 0.01) => {
        const actualNum = Number(actual);
        const passed = Math.abs(actualNum - expected) <= delta;
        this.assertions.push({
          description,
          passed,
          expected: `≈ ${expected} (±${delta})`,
          actual: actualNum,
          errorMessage: passed ? undefined : `Expected ${actualNum} to be within ${delta} of ${expected}`,
        });
      },
      toBeTruthy: () => {
        const passed = Boolean(actual);
        this.assertions.push({
          description,
          passed,
          expected: true,
          actual,
          errorMessage: passed ? undefined : `Expected truthy value, got ${JSON.stringify(actual)}`,
        });
      },
      toBeFalsy: () => {
        const passed = !Boolean(actual);
        this.assertions.push({
          description,
          passed,
          expected: false,
          actual,
          errorMessage: passed ? undefined : `Expected falsy value, got ${JSON.stringify(actual)}`,
        });
      },
      toBeGreaterThan: (expected: number) => {
        const passed = Number(actual) > expected;
        this.assertions.push({
          description,
          passed,
          expected: `> ${expected}`,
          actual,
          errorMessage: passed ? undefined : `Expected ${actual} to be greater than ${expected}`,
        });
      },
      toContain: (expectedSubstring: string) => {
        const actualStr = String(actual || '');
        const passed = actualStr.includes(expectedSubstring);
        this.assertions.push({
          description,
          passed,
          expected: `Contains "${expectedSubstring}"`,
          actual: actualStr,
          errorMessage: passed ? undefined : `String does not contain substring "${expectedSubstring}"`,
        });
      },
    };
  }
}

export type TestFn = (t: AssertionContext) => void | Promise<void>;

export interface RegisteredTest {
  id: string;
  jiraKey?: string;
  name: string;
  suite: string;
  fn: TestFn;
}

export class TestRegistry {
  private static tests: RegisteredTest[] = [];

  public static register(suite: string, name: string, fn: TestFn, jiraKey?: string, id?: string): void {
    this.tests.push({
      id: id || `test_${Math.random().toString(36).substring(2, 9)}`,
      jiraKey,
      suite,
      name,
      fn,
    });
  }

  public static getRegisteredTests(): RegisteredTest[] {
    return this.tests;
  }

  public static async runSuite(suiteName?: string): Promise<TestSuiteResult[]> {
    const targetTests = suiteName
      ? this.tests.filter((t) => t.suite === suiteName)
      : this.tests;

    const suiteMap = new Map<string, TestCaseResult[]>();

    for (const test of targetTests) {
      const start = performance.now();
      const ctx = new AssertionContext();
      let passed = true;
      let error: string | undefined;

      try {
        await test.fn(ctx);
        const hasFailedAssertion = ctx.assertions.some((a) => !a.passed);
        if (hasFailedAssertion) {
          passed = false;
        }
      } catch (err: unknown) {
        passed = false;
        error = err instanceof Error ? err.message : String(err);
      }

      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      const caseResult: TestCaseResult = {
        id: test.id,
        jiraKey: test.jiraKey,
        name: test.name,
        suite: test.suite,
        passed,
        durationMs,
        assertions: ctx.assertions,
        error,
      };

      const existing = suiteMap.get(test.suite) || [];
      existing.push(caseResult);
      suiteMap.set(test.suite, existing);
    }

    const results: TestSuiteResult[] = [];
    suiteMap.forEach((tests, name) => {
      const passedCount = tests.filter((t) => t.passed).length;
      const totalDuration = tests.reduce((acc, t) => acc + t.durationMs, 0);
      results.push({
        suiteName: name,
        total: tests.length,
        passed: passedCount,
        failed: tests.length - passedCount,
        durationMs: Math.round(totalDuration * 100) / 100,
        tests,
      });
    });

    return results;
  }
}
