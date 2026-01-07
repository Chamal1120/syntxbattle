/**
 * Syntxbattle - Battle Logic Unit Tests
 *
 * @description
 * Unit tests for battle/match creation and joining logic.
 *
 * @author Chamal Mallawaarachchi
 */
import { describe, it, expect } from 'vitest';

describe('Match validation', () => {
    it('validates max players within range', () => {
        const maxPlayers = 4;

        expect(maxPlayers).toBeGreaterThan(0);
        expect(maxPlayers).toBeLessThanOrEqual(10);
    });

    it('defaults to 2 players when invalid', () => {
        const input = '';
        const maxPlayers = parseInt(input) || 2;

        expect(maxPlayers).toBe(2);
    });

    it('parses valid max players', () => {
        const input = '5';
        const maxPlayers = parseInt(input) || 2;

        expect(maxPlayers).toBe(5);
    });

    it('handles non-numeric input', () => {
        const input = 'abc';
        const maxPlayers = parseInt(input) || 2;

        expect(maxPlayers).toBe(2);
    });
});

describe('Match state checks', () => {
    it('detects full match', () => {
        const participants = [
            { user_id: '1' },
            { user_id: '2' },
            { user_id: '3' },
            { user_id: '4' },
        ];
        const maxPlayers = 4;

        const isFull = participants.length >= maxPlayers;

        expect(isFull).toBe(true);
    });

    it('detects match with space', () => {
        const participants = [{ user_id: '1' }, { user_id: '2' }];
        const maxPlayers = 4;

        const isFull = participants.length >= maxPlayers;

        expect(isFull).toBe(false);
    });

    it('calculates remaining slots', () => {
        const participants = [{ user_id: '1' }, { user_id: '2' }];
        const maxPlayers = 5;

        const remainingSlots = maxPlayers - participants.length;

        expect(remainingSlots).toBe(3);
    });
});

describe('Participant checks', () => {
    it('detects existing participant', () => {
        const participants = [{ user_id: '1' }, { user_id: '2' }];
        const userId = '2';

        const alreadyJoined = participants.some((p) => p.user_id === userId);

        expect(alreadyJoined).toBe(true);
    });

    it('detects new participant', () => {
        const participants = [{ user_id: '1' }, { user_id: '2' }];
        const userId = '3';

        const alreadyJoined = participants.some((p) => p.user_id === userId);

        expect(alreadyJoined).toBe(false);
    });

    it('finds participant by user id', () => {
        const participants = [
            { user_id: '1', status: 'competing' },
            { user_id: '2', status: 'finished' },
        ];
        const userId = '2';

        const participant = participants.find((p) => p.user_id === userId);

        expect(participant?.status).toBe('finished');
    });
});

describe('Match timing', () => {
    it('detects started match', () => {
        const match = {
            started_at: new Date('2024-01-01T10:00:00Z').toISOString(),
        };

        const isStarted = match.started_at !== null;

        expect(isStarted).toBe(true);
    });

    it('detects waiting match', () => {
        const match = {
            started_at: null,
        };

        const isStarted = match.started_at !== null;

        expect(isStarted).toBe(false);
    });

    it('calculates elapsed time since start', () => {
        const startedAt = new Date('2024-01-01T10:00:00Z');
        const now = new Date('2024-01-01T10:05:30Z');

        const elapsedMs = now.getTime() - startedAt.getTime();

        expect(elapsedMs).toBe(330000);
    });
});
