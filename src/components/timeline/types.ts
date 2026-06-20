import { Project } from '@/lib/types';

export type TimelineSession = {
    id: string;
    project: Project;
    startedAt: number;
    endedAt: number;
    duration: number;
    title?: string;
    note?: string;
    top: number;
    height: number;
    left: number;
    width: number;
    isRunning: boolean;
};

export interface LayoutItem {
    id: string;
    project: Project;
    startedAt: number;
    endedAt: number;
    duration: number;
    title?: string;
    note?: string;
    top: number;
    height: number;
    isRunning: boolean;
    original: {
        projects: Project | null;
        id: string;
        started_at: number | null;
        ended_at: number | null;
        duration: number | null;
        title: string | null;
        note: string | null;
    };
}
