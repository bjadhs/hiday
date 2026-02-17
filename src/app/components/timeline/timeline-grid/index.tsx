import { HOURS, HOUR_HEIGHT, MIN_CONTENT_WIDTH } from '../constants';
import { TimelineSession } from '../types';
import { CurrentTimeIndicator } from '../current-time-indicator';
import { SessionBlock } from '../session-block';

interface TimelineGridProps {
    totalHeight: number;
    isToday: boolean;
    now: number;
    startOfDay: number;
    timelineSessions: TimelineSession[];
    onEditSession: (session: TimelineSession) => void;
}

export function TimelineGrid({
    totalHeight,
    isToday,
    now,
    startOfDay,
    timelineSessions,
    onEditSession,
}: TimelineGridProps) {
    return (
        <div
            className='relative flex-1'
            style={{ minWidth: MIN_CONTENT_WIDTH, height: totalHeight }}
        >
            {/* Hour grid lines */}
            <div className='absolute inset-0'>
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className='border-b border-border/30 dark:border-border-dark/30'
                        style={{ height: HOUR_HEIGHT }}
                    />
                ))}
            </div>

            {/* Current time indicator */}
            {isToday && <CurrentTimeIndicator now={now} startOfDay={startOfDay} totalHeight={totalHeight} />}

            {/* Sessions */}
            <div className='relative h-full'>
                {timelineSessions.length === 0 ? (
                    <div className='absolute inset-0 flex items-center justify-center'>
                        <p className='text-muted-foreground text-sm'>
                            No sessions for this day
                        </p>
                    </div>
                ) : (
                    timelineSessions.map((session) => (
                        <SessionBlock
                            key={session.id}
                            session={session}
                            onClick={() => onEditSession(session)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
