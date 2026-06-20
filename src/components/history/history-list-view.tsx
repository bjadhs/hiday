import { HistorySession } from '@/lib/types';
import { HistorySessionItem } from './history-session-item';
import { EmptyState } from './history-empty-state';

interface HistoryListViewProps {
    sessions: HistorySession[];
    onEditSession: (session: HistorySession) => void;
}

export function HistoryListView({
    sessions,
    onEditSession,
}: HistoryListViewProps) {
    return (
        <div className='bg-surface border-2 border-border-strong rounded-xl shadow-brutal overflow-hidden'>
            <div className='p-4 lg:p-6 border-b-2 border-border'>
                <h2 className='text-xl font-bold tracking-tight'>Session Log</h2>
                <p className='text-sm text-muted-foreground mt-1'>
                    All tracked sessions for the selected date
                </p>
            </div>

            <div className='divide-y divide-border'>
                {sessions.length === 0 ? (
                    <EmptyState message='No sessions recorded for this date' />
                ) : (
                    sessions.map((session, index) => (
                        <HistorySessionItem
                            key={session.id}
                            session={session}
                            index={index + 1}
                            onEdit={onEditSession}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
