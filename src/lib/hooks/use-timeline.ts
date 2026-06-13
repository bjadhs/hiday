import { useState, useEffect, useMemo, useRef } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useSessions } from '@/lib/hooks/use-sessions';
import { calculateTimelineLayout } from '@/components/timeline/utils';
import { HOUR_HEIGHT } from '@/components/timeline/constants';
import { useNow } from '@/lib/hooks/use-now';
import { useMounted } from '@/lib/hooks/use-mounted';

export function useTimeline() {
    const mounted = useMounted();
    const now = useNow(60000);
    // Timeline is rendered client-only (ssr: false), so we can use the real date immediately.
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Calculate start and end of selected date
    const startOfDay = useMemo(() => {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }, [selectedDate]);

    const endOfDay = useMemo(() => {
        return startOfDay + 24 * 60 * 60 * 1000 - 1; // End of day inclusive
    }, [startOfDay]);

    const { data: sessions = [], isLoading } = useSessions(startOfDay, endOfDay, {
      placeholderData: keepPreviousData,
    });

    const timelineSessions = useMemo(
        () => calculateTimelineLayout(sessions, startOfDay, now),
        [sessions, startOfDay, now]
    );

    // Scroll to current time on mount and when date changes (if today)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!scrollContainerRef.current) return;
        const isTodayDate = selectedDate.toDateString() === new Date().toDateString();

        scrollTimeoutRef.current = setTimeout(() => {
            if (!scrollContainerRef.current) return;
            if (isTodayDate) {
                const currentNow = Date.now();
                const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
                const scrollPosition = (currentNow - startOfDay) / msPerPixel - 200;
                scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
            } else {
                scrollContainerRef.current.scrollTop = 0;
            }
        }, 0);

        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
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
        isMounted: mounted,
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
