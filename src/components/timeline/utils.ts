import { Task } from '@/lib/types';
import { TimelineSession, LayoutItem } from './types';
import { HOUR_HEIGHT, MIN_SESSION_HEIGHT_PX } from './constants';

export function calculateTimelineLayout(
    sessions: { id: string; started_at: number; ended_at: number | null; duration: number | null; title: string | null; note: string | null; tasks: Task | null }[],
    dayStart: number,
    now: number
): TimelineSession[] {
    if (!sessions.length) return [];

    const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;

    // 1. Prepare visual layout data
    const initialLayout: LayoutItem[] = sessions.map(s => {
        const startedAt = s.started_at;
        const endedAt = s.ended_at || now;
        const top = (startedAt - dayStart) / msPerPixel;
        const actualHeight = (endedAt - startedAt) / msPerPixel;
        const height = Math.max(actualHeight, MIN_SESSION_HEIGHT_PX);

        return {
            id: s.id,
            task: s.tasks || { id: 'unknown', name: 'Unknown', color: '#999', icon: '❓' },
            startedAt,
            endedAt,
            duration: s.duration || 0,
            title: s.title || undefined,
            note: s.note || undefined,
            top,
            height,
            isRunning: s.ended_at === null,
            original: s
        };
    }).sort((a, b) => a.top - b.top || b.height - a.height);

    // 2. Group sessions into visually overlapping connected components
    const groups: LayoutItem[][] = [];
    const visited = new Set<string>();

    for (const session of initialLayout) {
        if (visited.has(session.id)) continue;

        const group: LayoutItem[] = [];
        const queue: LayoutItem[] = [session];
        visited.add(session.id);

        while (queue.length > 0) {
            const current = queue.shift()!;
            group.push(current);

            for (const other of initialLayout) {
                if (visited.has(other.id)) continue;

                // Visual overlap check
                const overlap = current.top < other.top + other.height &&
                    current.top + current.height > other.top;

                if (overlap) {
                    visited.add(other.id);
                    queue.push(other);
                }
            }
        }
        groups.push(group);
    }

    // 3. For each group, assign to columns (slots)
    const result: TimelineSession[] = [];

    for (const group of groups) {
        // Sort group by top position
        group.sort((a, b) => a.top - b.top || b.height - a.height);

        const columns: LayoutItem[] = []; // Tracks the last item in each column
        const sessionToColumn = new Map<string, number>();

        for (const session of group) {
            let assignedColumn = -1;

            for (let c = 0; c < columns.length; c++) {
                const lastInColumn = columns[c];
                const overlap = session.top < lastInColumn.top + lastInColumn.height &&
                    session.top + session.height > lastInColumn.top;

                if (!overlap) {
                    assignedColumn = c;
                    break;
                }
            }

            if (assignedColumn === -1) {
                columns.push(session);
                sessionToColumn.set(session.id, columns.length - 1);
            } else {
                columns[assignedColumn] = session;
                sessionToColumn.set(session.id, assignedColumn);
            }
        }

        const totalColumns = columns.length;

        // 4. Calculate final position and width
        for (const session of group) {
            const column = sessionToColumn.get(session.id) || 0;
            const left = (column / totalColumns) * 100;
            const width = 100 / totalColumns;

            result.push({
                ...session,
                left,
                width,
            });
        }
    }

    return result.sort((a, b) => a.startedAt - b.startedAt);
}

export function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

export function formatHour(hour: number): string {
    if (hour === 0 || hour === 24) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
}
