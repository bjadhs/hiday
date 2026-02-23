import { useState, useEffect, useMemo, useRef } from 'react';
import { useSessions } from '@/lib/hooks/use-sessions';
import { calculateTimelineLayout } from '@/components/timeline/utils';
import { HOUR_HEIGHT } from '@/components/timeline/constants';

export function useTimeline() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isMounted, setIsMounted] = useState(false);
    const [now, setNow] = useState(Date.now());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
        // Update 'now' every minute to refresh timeline layout and indicator
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Calculate start and end of selected date
    const startOfDay = useMemo(() => {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }, [selectedDate]);

    const endOfDay = useMemo(() => {
        return startOfDay + 24 * 60 * 60 * 1000 - 1; // End of day inclusive
    }, [startOfDay]);

    const { data: sessions = [], isLoading } = useSessions(startOfDay, endOfDay);

    const timelineSessions = useMemo(
        () => calculateTimelineLayout(sessions, startOfDay, now),
        [sessions, startOfDay, now]
    );

    // Scroll to current time on mount and when date changes (if today)
    useEffect(() => {
        if (!scrollContainerRef.current) return;
        const isToday = selectedDate.toDateString() === new Date().toDateString();

        if (isToday) {
            const currentNow = Date.now();
            const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
            const scrollPosition = (currentNow - startOfDay) / msPerPixel - 200;
            scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
        } else {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [selectedDate, startOfDay]);

    const goToPreviousDay = () => {
        setSelectedDate((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() - 1);
            return newDate;
        });
    };

    const goToNextDay = () => {
        setSelectedDate((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + 1);
            return newDate;
        });
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const isToday = selectedDate.toDateString() === new Date().toDateString();

    return {
        selectedDate,
        isMounted,
        now,
        startOfDay,
        isLoading,
        timelineSessions,
        scrollContainerRef,
        goToPreviousDay,
        goToNextDay,
        goToToday,
        isToday,
    };
}
