/**
 * Syntxbattle - URL and Route Utility Tests
 *
 * @description
 * Unit tests for URL parsing and route utilities.
 *
 * @author Chamal Mallawaarachchi
 */
import { describe, it, expect } from 'vitest';

describe('Language parameter parsing', () => {
    it('extracts language from URL params', () => {
        const url = new URL('http://localhost/arena/123?lang=javascript');
        const language = url.searchParams.get('lang') || 'javascript';

        expect(language).toBe('javascript');
    });

    it('defaults to javascript when no lang param', () => {
        const url = new URL('http://localhost/arena/123');
        const language = url.searchParams.get('lang') || 'javascript';

        expect(language).toBe('javascript');
    });

    it('handles python language param', () => {
        const url = new URL('http://localhost/arena/123?lang=python');
        const language = url.searchParams.get('lang');

        expect(language).toBe('python');
    });

    it('handles typescript language param', () => {
        const url = new URL('http://localhost/arena/123?lang=typescript');
        const language = url.searchParams.get('lang');

        expect(language).toBe('typescript');
    });
});

describe('Redirect URL construction', () => {
    it('constructs auth callback URL', () => {
        const origin = 'http://localhost:5173';
        const redirectUrl = `${origin}/auth/callback?next=/battle`;

        expect(redirectUrl).toBe('http://localhost:5173/auth/callback?next=/battle');
    });

    it('constructs battle redirect URL', () => {
        const matchId = 'abc123';
        const redirectUrl = `/battle/match/${matchId}`;

        expect(redirectUrl).toBe('/battle/match/abc123');
    });

    it('constructs arena redirect URL', () => {
        const matchId = 'xyz789';
        const language = 'python';
        const redirectUrl = `/arena/${matchId}?lang=${language}`;

        expect(redirectUrl).toBe('/arena/xyz789?lang=python');
    });
});

describe('Auth code extraction', () => {
    it('extracts code from callback URL', () => {
        const url = new URL('http://localhost/auth/callback?code=auth123&next=/battle');
        const code = url.searchParams.get('code');

        expect(code).toBe('auth123');
    });

    it('extracts next parameter', () => {
        const url = new URL('http://localhost/auth/callback?code=auth123&next=/battle');
        const next = url.searchParams.get('next') ?? '/battle';

        expect(next).toBe('/battle');
    });

    it('defaults next to /battle when missing', () => {
        const url = new URL('http://localhost/auth/callback?code=auth123');
        const next = url.searchParams.get('next') ?? '/battle';

        expect(next).toBe('/battle');
    });

    it('handles missing code parameter', () => {
        const url = new URL('http://localhost/auth/callback');
        const code = url.searchParams.get('code');

        expect(code).toBeNull();
    });
});

describe('Match ID validation', () => {
    it('validates UUID format', () => {
        const validUUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        expect(uuidRegex.test(validUUID)).toBe(true);
    });

    it('rejects invalid UUID format', () => {
        const invalidUUID = 'not-a-uuid';
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        expect(uuidRegex.test(invalidUUID)).toBe(false);
    });
});
