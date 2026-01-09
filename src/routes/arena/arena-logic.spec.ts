/**
 * Syntxbattle - Arena Logic Unit Tests
 *
 * @description
 * Unit tests for arena-related logic including time calculations,
 * participant filtering, sorting, and state management.
 *
 * @author Chamal Mallawaarachchi
 */
import { describe, it, expect } from 'vitest';

describe('Time calculations', () => {
    it('calculates completion time in milliseconds', () => {
        const startTime = new Date('2024-01-01T10:00:00Z');
        const endTime = new Date('2024-01-01T10:02:30Z');

        const completionTimeMs = endTime.getTime() - startTime.getTime();

        expect(completionTimeMs).toBe(150000);
    });

    it('formats time for display', () => {
        const ms = 125000;
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        expect(minutes).toBe(2);
        expect(seconds).toBe(5);
    });

    it('formats zero time correctly', () => {
        const ms = 0;
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        expect(minutes).toBe(0);
        expect(seconds).toBe(0);
    });

    it('formats hours correctly', () => {
        const ms = 3665000;
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        expect(hours).toBe(1);
        expect(minutes).toBe(1);
        expect(seconds).toBe(5);
    });
});

describe('Participant filtering', () => {
    const participants: Array<{
        user_id: string;
        status: string;
        completion_time_ms: number | null;
        finished_at?: string;
    }> = [
        { user_id: '1', status: 'finished', completion_time_ms: 45000 },
        { user_id: '2', status: 'competing', completion_time_ms: null },
        { user_id: '3', status: 'left', completion_time_ms: null },
        { user_id: '4', status: 'finished', completion_time_ms: 30000 },
    ];

    it('filters finished participants', () => {
        const finished = participants.filter((p) => p.status === 'finished');

        expect(finished).toHaveLength(2);
        expect(finished[0].user_id).toBe('1');
        expect(finished[1].user_id).toBe('4');
    });

    it('filters active competitors', () => {
        const active = participants.filter((p) => p.status !== 'finished' && p.status !== 'left');

        expect(active).toHaveLength(1);
        expect(active[0].user_id).toBe('2');
    });

    it('filters left participants', () => {
        const left = participants.filter((p) => p.status === 'left');

        expect(left).toHaveLength(1);
        expect(left[0].user_id).toBe('3');
    });

    it('counts all participants', () => {
        expect(participants).toHaveLength(4);
    });
});

describe('Participant sorting', () => {
    it('sorts by completion time ascending', () => {
        const unsorted = [
            { user_id: '1', status: 'finished', completion_time_ms: 60000 },
            { user_id: '2', status: 'finished', completion_time_ms: 30000 },
            { user_id: '3', status: 'finished', completion_time_ms: 45000 },
        ];

        const sorted = [...unsorted].sort(
            (a, b) => (a.completion_time_ms || 0) - (b.completion_time_ms || 0)
        );

        expect(sorted[0].user_id).toBe('2');
        expect(sorted[1].user_id).toBe('3');
        expect(sorted[2].user_id).toBe('1');
    });

    it('handles null completion times', () => {
        const unsorted = [
            { user_id: '1', status: 'finished', completion_time_ms: 60000 },
            { user_id: '2', status: 'competing', completion_time_ms: null },
            { user_id: '3', status: 'finished', completion_time_ms: 30000 },
        ];

        const sorted = [...unsorted].sort(
            (a, b) => (a.completion_time_ms || Infinity) - (b.completion_time_ms || Infinity)
        );

        expect(sorted[0].user_id).toBe('3');
        expect(sorted[1].user_id).toBe('1');
        expect(sorted[2].user_id).toBe('2');
    });
});

describe('Participant state updates', () => {
    it('updates participant to finished status', () => {
        const participants: Array<{
            user_id: string;
            status: string;
            completion_time_ms: number | null;
            finished_at?: string;
        }> = [
            { user_id: '1', status: 'competing', completion_time_ms: null },
            { user_id: '2', status: 'competing', completion_time_ms: null },
        ];

        const payload = {
            user_id: '1',
            status: 'finished',
            completion_time_ms: 45000,
            finished_at: new Date().toISOString(),
        };

        const index = participants.findIndex((p) => p.user_id === payload.user_id);
        participants[index] = { ...participants[index], ...payload };

        expect(participants[0].status).toBe('finished');
        expect(participants[0].completion_time_ms).toBe(45000);
        expect(participants[1].status).toBe('competing');
    });

    it('marks participant as left', () => {
        const participants = [{ user_id: '1', status: 'competing', completion_time_ms: null }];

        const index = participants.findIndex((p) => p.user_id === '1');
        participants[index] = { ...participants[index], status: 'left' };

        expect(participants[0].status).toBe('left');
    });
});

describe('Match state checks', () => {
    it('detects all participants finished', () => {
        const participants = [
            { user_id: '1', status: 'finished' },
            { user_id: '2', status: 'finished' },
        ];

        const allFinished = participants.every(
            (p) => p.status === 'finished' || p.status === 'left'
        );

        expect(allFinished).toBe(true);
    });

    it('detects ongoing match', () => {
        const participants = [
            { user_id: '1', status: 'finished' },
            { user_id: '2', status: 'competing' },
        ];

        const allFinished = participants.every(
            (p) => p.status === 'finished' || p.status === 'left'
        );

        expect(allFinished).toBe(false);
    });

    it('counts active competitors', () => {
        const participants = [
            { user_id: '1', status: 'finished' },
            { user_id: '2', status: 'competing' },
            { user_id: '3', status: 'left' },
            { user_id: '4', status: 'competing' },
        ];

        const activeCount = participants.filter(
            (p) => p.status !== 'finished' && p.status !== 'left'
        ).length;

        expect(activeCount).toBe(2);
    });
});
