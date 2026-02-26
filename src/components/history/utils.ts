import { HistorySession, Task } from '@/lib/types';

export function isToday(date: Date): boolean {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}

export function formatTotalDuration(sessions: HistorySession[]): string {
    const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export function formatLongestSession(sessions: HistorySession[]): string {
    if (sessions.length === 0) return '0m';
    const longest = Math.max(...sessions.map((s) => s.duration));
    const hours = Math.floor(longest / 3600);
    const minutes = Math.floor((longest % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export function getSessionsForHour(
    sessions: HistorySession[],
    hour: number,
): HistorySession[] {
    const hourStart = hour * 60 * 60 * 1000;
    const hourEnd = (hour + 1) * 60 * 60 * 1000;

    return sessions.filter((session) => {
        if (!session.startedAt) return false;
        const sessionStart = session.startedAt % (24 * 60 * 60 * 1000);
        const sessionEnd = session.endedAt
            ? session.endedAt % (24 * 60 * 60 * 1000)
            : hourEnd;

        // Check if session overlaps with this hour
        return sessionStart < hourEnd && sessionEnd > hourStart;
    });
}

export function calculateBlockPosition(
    startedAt: number,
    endedAt: number | null,
    hour: number,
): { left: number; width: number } {
    const hourStart = hour * 60 * 60 * 1000;
    const hourEnd = (hour + 1) * 60 * 60 * 1000;

    const entryStart = startedAt % (24 * 60 * 60 * 1000);
    const entryEnd = endedAt ? endedAt % (24 * 60 * 60 * 1000) : hourEnd;

    // Clamp to hour boundaries
    const blockStart = Math.max(entryStart, hourStart);
    const blockEnd = Math.min(entryEnd, hourEnd);

    const hourDuration = 60 * 60 * 1000;
    const left = ((blockStart - hourStart) / hourDuration) * 100;
    const width = ((blockEnd - blockStart) / hourDuration) * 100;

    return { left: Math.max(0, left), width: Math.max(0, width) };
}

export function getUniqueTasks(sessions: HistorySession[]): Task[] {
    const seen = new Set<string>();
    return sessions
        .map((s) => s.task)
        .filter((task) => {
            if (seen.has(task.id)) return false;
            seen.add(task.id);
            return true;
        });
}
