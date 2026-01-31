import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Activity, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const StatusBar: React.FC = () => {
    const status = useAppStore((state) => state.backendStatus);
    const isLoading = useAppStore((state) => state.isLoading);
    const projectCount = useAppStore((state) => state.projects.length);
    const fileCount = useAppStore((state) => state.fileSystem.length);

    const getStatusContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex items-center gap-2 text-blue-400">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Syncing...</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle size={12} />
                        <span>System Error</span>
                    </div>
                );
            case 'saving':
                return (
                    <div className="flex items-center gap-2 text-yellow-400">
                        <Activity size={12} className="animate-pulse" />
                        <span>Saving...</span>
                    </div>
                );
            case 'ready':
            default:
                return (
                    <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={12} />
                        <span>System Ready</span>
                    </div>
                );
        }
    };

    return (
        <div className="h-6 bg-[#09090b] border-t border-white/5 flex items-center justify-between px-3 text-[10px] select-none z-50">
            <div className="flex items-center gap-4">
                {getStatusContent()}
                <div className="h-3 w-px bg-white/10" />
                <span className="text-gray-500">Imagine Read Engine v1.0</span>
            </div>

            <div className="flex items-center gap-4 text-gray-500">
                <span>Projects: {projectCount}</span>
                <span>Files: {fileCount}</span>
                {isLoading && <Loader2 size={10} className="animate-spin text-blue-500" />}
            </div>
        </div>
    );
};
