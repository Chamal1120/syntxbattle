/**
 * Syntxbattle - Test Runner Logic Unit Tests
 *
 * @description
 * Unit tests for code execution and test validation logic.
 *
 * @author Chamal Mallawaarachchi
 */
import { describe, it, expect } from 'vitest';

describe('Test case validation', () => {
    it('compares simple values correctly', () => {
        const expected = 5;
        const actual = 5;

        expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
    });

    it('compares arrays correctly', () => {
        const expected = [1, 2, 3];
        const actual = [1, 2, 3];

        expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
    });

    it('detects array differences', () => {
        const expected = [1, 2, 3];
        const actual = [1, 2, 4];

        expect(JSON.stringify(actual)).not.toBe(JSON.stringify(expected));
    });

    it('compares objects correctly', () => {
        const expected = { result: true, value: 42 };
        const actual = { result: true, value: 42 };

        expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
    });

    it('detects object differences', () => {
        const expected = { result: true, value: 42 };
        const actual = { result: false, value: 42 };

        expect(JSON.stringify(actual)).not.toBe(JSON.stringify(expected));
    });
});

describe('Test result aggregation', () => {
    it('counts passed tests correctly', () => {
        const results = [{ passed: true }, { passed: true }, { passed: false }, { passed: true }];

        const passedCount = results.filter((r) => r.passed).length;

        expect(passedCount).toBe(3);
    });

    it('detects all tests passed', () => {
        const results = [{ passed: true }, { passed: true }, { passed: true }];

        const allPassed = results.every((r) => r.passed);

        expect(allPassed).toBe(true);
    });

    it('detects some tests failed', () => {
        const results = [{ passed: true }, { passed: false }, { passed: true }];

        const allPassed = results.every((r) => r.passed);

        expect(allPassed).toBe(false);
    });

    it('calculates success rate', () => {
        const results = [{ passed: true }, { passed: true }, { passed: false }, { passed: true }];

        const passedCount = results.filter((r) => r.passed).length;
        const total = results.length;
        const successRate = (passedCount / total) * 100;

        expect(successRate).toBe(75);
    });
});

describe('Completion time calculation', () => {
    it('calculates completion time from timestamps', () => {
        const startTime = new Date('2024-01-01T10:00:00Z');
        const finishTime = new Date('2024-01-01T10:02:30Z');

        const completionTimeMs = finishTime.getTime() - startTime.getTime();

        expect(completionTimeMs).toBe(150000);
    });

    it('handles same-second completion', () => {
        const startTime = new Date('2024-01-01T10:00:00Z');
        const finishTime = new Date('2024-01-01T10:00:00.500Z');

        const completionTimeMs = finishTime.getTime() - startTime.getTime();

        expect(completionTimeMs).toBe(500);
    });

    it('creates ISO timestamp for database', () => {
        const finishTime = new Date('2024-01-01T10:00:00Z');
        const isoString = finishTime.toISOString();

        expect(isoString).toBe('2024-01-01T10:00:00.000Z');
    });
});

describe('Function name extraction', () => {
    it('validates function name format', () => {
        const validNames = ['sum', 'fibonacci', 'isPalindrome', 'reverseString'];

        validNames.forEach((name) => {
            expect(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)).toBe(true);
        });
    });

    it('rejects invalid function names', () => {
        const invalidNames = ['123invalid', 'my-function', 'my function', ''];

        invalidNames.forEach((name) => {
            expect(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)).toBe(false);
        });
    });
});

describe('Test case argument serialization', () => {
    it('serializes primitive arguments', () => {
        const args = [1, 'hello', true];
        const serialized = args.map((arg) => JSON.stringify(arg)).join(', ');

        expect(serialized).toBe('1, "hello", true');
    });

    it('serializes array arguments', () => {
        const args = [[1, 2, 3]];
        const serialized = args.map((arg) => JSON.stringify(arg)).join(', ');

        expect(serialized).toBe('[1,2,3]');
    });

    it('serializes object arguments', () => {
        const args = [{ x: 1, y: 2 }];
        const serialized = args.map((arg) => JSON.stringify(arg)).join(', ');

        expect(serialized).toBe('{"x":1,"y":2}');
    });

    it('serializes multiple arguments', () => {
        const args = [5, [1, 2], { key: 'value' }];
        const serialized = args.map((arg) => JSON.stringify(arg)).join(', ');

        expect(serialized).toBe('5, [1,2], {"key":"value"}');
    });
});
