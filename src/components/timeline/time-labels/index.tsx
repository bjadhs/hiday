import { HOURS, HOUR_HEIGHT, TIME_COLUMN_WIDTH } from '../constants';
import { formatHour } from '../utils';

export function TimeLabels() {
    return (
        <div
            className='sticky left-0 z-20 shrink-0 border-r-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark'
            style={{ width: TIME_COLUMN_WIDTH }}
        >
            {HOURS.map((hour) => (
                <div
                    key={hour}
                    className='flex items-start justify-end pr-3 pt-3 border-b border-border/50 dark:border-border-dark/50'
                    style={{ height: HOUR_HEIGHT }}
                >
                    <span className='text-xs font-semibold text-muted-foreground'>
                        {formatHour(hour)}
                    </span>
                </div>
            ))}
        </div>
    );
}
