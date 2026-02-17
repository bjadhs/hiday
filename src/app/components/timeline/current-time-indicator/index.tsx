import { formatTime } from '../utils';
import { HOUR_HEIGHT } from '../constants';

interface CurrentTimeIndicatorProps {
    now: number;
    startOfDay: number;
    totalHeight: number;
}

export function CurrentTimeIndicator({ now, startOfDay, totalHeight }: CurrentTimeIndicatorProps) {
    const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
    const top = (now - startOfDay) / msPerPixel;

    // Only show if within the 24-hour range
    if (top < 0 || top > totalHeight) return null;

    return (
        <div
            className='absolute left-0 right-0 z-30 pointer-events-none'
            style={{ top }}
        >
            <div className='flex items-center'>
                <div className='w-2 h-2 rounded-full bg-danger -ml-1 shadow-sm' />
                <div className='flex-1 h-0.5 bg-danger shadow-sm' />
            </div>
            <div className='absolute -top-5 right-2 bg-danger text-white text-[10px] px-2 py-0.5 rounded font-medium shadow-sm'>
                {formatTime(now)}
            </div>
        </div>
    );
}
