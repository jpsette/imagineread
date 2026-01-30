import React, { useState } from 'react';
import { FileJson, Image, FileText, Download, Loader2 } from 'lucide-react';
import { BaseModal } from '@shared/ui/Modal';
import { API_ENDPOINTS } from '@app/config';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    projectId,
    projectName
}) => {
    const [loading, setLoading] = useState<string | null>(null); // 'pdf' | 'clean_images' | 'json'

    if (!isOpen) return null;

    // Use JobStore access via hook in component body (needs to be moved up)
    // To do this properly, we need to import useJobStore outside.
    // However, since handleExport is inside the component, we can use the hook.

    // We can't easily import the hook inside the function, so we rely on the component using it.
    // See the full component update below.

    const handleExport = async (format: 'pdf' | 'clean_images' | 'json_data') => {
        setLoading(format);
        try {
            const response = await fetch(API_ENDPOINTS.PROJECT_EXPORT(projectId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format })
            });

            if (!response.ok) throw new Error('Export failed to start');

            const data = await response.json();

            // Expected Response: { status: "queued", jobId: "..." }
            if (data.jobId) {
                // Job Started!
                // We can close the modal immediately or show a success message.
                // Let's close it and let the JobMonitor handle it.
                // Trigger a poll update if possible
                // useJobStore.getState().fetchJobs(); 

                onClose();
                // Optional: Show a toast? 
                // For now, the JobMonitor appearing is the feedback.
            }

        } catch (error) {
            console.error(error);
            alert('Falha ao iniciar exportação.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Exportar Projeto"
            size="2xl"
        >
            <div className="flex flex-col gap-2 mb-6">
                <p className="text-sm text-zinc-400">Escolha o formato de saída para "{projectName}"</p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Option 1: Clean Images */}
                <button
                    disabled={!!loading}
                    onClick={() => handleExport('clean_images')}
                    // ... rest of the button code remains largely similar but checking classes
                    className="group relative flex flex-col items-start p-6 rounded-xl border border-[#27272a] bg-[#27272a]/30 hover:bg-[#27272a]/80 hover:border-blue-500/50 transition-all text-left disabled:opacity-50"
                >
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                        <Image size={24} />
                    </div>
                    <h3 className="font-bold text-white mb-1">Imagens Limpas</h3>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        ZIP com artes em alta resolução, sem balões e onomatopeias.
                    </p>
                    <div className="mt-auto w-full pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-medium text-blue-400 opacity-60 group-hover:opacity-100">
                        {loading === 'clean_images' ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        Download ZIP
                    </div>
                </button>

                {/* Option 2: JSON Data */}
                <button
                    disabled={!!loading}
                    onClick={() => handleExport('json_data')}
                    className="group relative flex flex-col items-start p-6 rounded-xl border border-[#27272a] bg-[#27272a]/30 hover:bg-[#27272a]/80 hover:border-yellow-500/50 transition-all text-left disabled:opacity-50"
                >
                    <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400 mb-4 group-hover:scale-110 transition-transform">
                        <FileJson size={24} />
                    </div>
                    <h3 className="font-bold text-white mb-1">Pacote de Dados</h3>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        Metadados completos: coordenadas de balões, textos detectados e estrutura.
                    </p>
                    <div className="mt-auto w-full pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-medium text-yellow-400 opacity-60 group-hover:opacity-100">
                        {loading === 'json_data' ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        Download JSON
                    </div>
                </button>

                {/* Option 3: PDF */}
                <button
                    disabled={!!loading}
                    onClick={() => handleExport('pdf')}
                    className="group relative flex flex-col items-start p-6 rounded-xl border border-[#27272a] bg-[#27272a]/30 hover:bg-[#27272a]/80 hover:border-red-500/50 transition-all text-left disabled:opacity-50"
                >
                    <div className="p-3 rounded-lg bg-red-500/10 text-red-400 mb-4 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                    <h3 className="font-bold text-white mb-1">PDF Final</h3>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        Arquivo único compilado com a visualização atual (Flattened).
                    </p>
                    <div className="mt-auto w-full pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-medium text-red-400 opacity-60 group-hover:opacity-100">
                        {loading === 'pdf' ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        Download PDF
                    </div>
                </button>

            </div>
        </BaseModal>
    );
};
