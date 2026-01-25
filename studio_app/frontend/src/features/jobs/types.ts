export type JobState = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Job {
    id: string;
    type: string;
    status: JobState;
    result?: any;
    error?: string;
    created_at: number;
    updated_at: number;
}
