import { Task } from '@/lib/types';

export type TimelineSession = {
    id: string;
    task: Task;
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
    task: Task;
    startedAt: number;
    endedAt: number;
    duration: number;
    title?: string;
    note?: string;
    top: number;
    height: number;
    isRunning: boolean;
    original: {
        tasks: Task | null;
        [key: string]: any;
    };
}
