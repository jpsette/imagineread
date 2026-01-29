import React, { useEffect, useState } from 'react';
import { useJobStore } from '../stores/useJobStore';
import { Activity, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Loader2, Download } from 'lucide-react';
import { Job, JobState } from '../types';

const StatusIcon = ({ status }: { status: JobState }) => {
    switch (status) {
        case 'PROCESSING': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
        case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-400" />;
        case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
        default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
};

const JobRow = ({ job }: { job: Job }) => (
    <div className="flex items-center justify-between p-2 text-xs border-b border-white/5 last:border-0 hover:bg-white/5">
        <div className="flex items-center gap-2">
            <StatusIcon status={job.status} />
            <div className="flex flex-col">
                <span className="font-medium text-gray-200">{job.type}</span>
                <span className="text-[10px] text-gray-500">{job.id.slice(0, 8)}</span>
            </div>
        </div>

        <div className="flex items-center gap-2">
            {job.status === 'COMPLETED' && job.result?.downloadUrl && (
                <a
                    href={job.result.downloadUrl}
                    download={job.result.filename || 'export.file'}
                    className="p-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 rounded transition-colors"
                    title="Download Result"
                >
                    <Download className="w-3 h-3" />
                </a>
            )}
            <span className="text-[10px] text-gray-500">
                {new Date(job.updated_at * 1000).toLocaleTimeString()}
            </span>
        </div>
    </div>
);

export const JobMonitor: React.FC = () => {
    const { jobs, activeJobsCount, startPolling, stopPolling, isLoading } = useJobStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const count = activeJobsCount();

    // Auto-start polling on mount
    useEffect(() => {
        startPolling();
        return () => stopPolling();
    }, []);

    // If no jobs ever ran and not loading, maybe hide? 
    // For now, let's keep it visible so user knows the system exists.
    // Or hide if empty list.
    if (jobs.length === 0 && !isLoading) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">

            {/* PANEL (Pointer Events Auto inside) */}
            <div className={`
                bg-[#1e1e1e] border border-white/10 shadow-2xl rounded-lg 
                transition-all duration-300 overflow-hidden pointer-events-auto
                ${isExpanded ? 'w-80 opacity-100 mb-2' : 'w-0 h-0 opacity-0'}
            `}>
                <div className="bg-white/5 px-3 py-2 flex justify-between items-center border-b border-white/10">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        Background Jobs ({count})
                    </span>
                    {isLoading && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                </div>

                <div className="max-h-60 overflow-y-auto">
                    {jobs.map(job => (
                        <JobRow key={job.id} job={job} />
                    ))}
                </div>
            </div>

            {/* TOGGLE BUTTON */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    pointer-events-auto
                    flex items-center gap-2 px-4 py-2 rounded-full 
                    bg-blue-600 hover:bg-blue-500 text-white shadow-lg 
                    transition-all border border-blue-400/30
                    ${count > 0 ? 'animate-pulse' : ''}
                `}
            >
                {count > 0 ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Activity className="w-4 h-4" />
                )}
                <span className="text-xs font-bold">
                    {count > 0 ? `${count} Processing` : 'Jobs'}
                </span>
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
        </div>
    );
};
