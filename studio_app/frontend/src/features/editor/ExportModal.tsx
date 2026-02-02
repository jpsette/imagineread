import React, { useState } from 'react';
import { FileJson, Image, FileText, Download, Loader2, Smartphone } from 'lucide-react';
import JSZip from 'jszip';
import { BaseModal } from '@shared/ui/Modal';
import { API_ENDPOINTS } from '@app/config';
import { FileEntry } from '@shared/types';
import { exportForMobile, getImageManifest } from './utils/exportForMobile';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
    pages: FileEntry[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    projectId,
    projectName,
    pages
}) => {
    const [loading, setLoading] = useState<string | null>(null); // 'pdf' | 'clean_images' | 'json' | 'mobile'

    if (!isOpen) return null;

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

            if (data.jobId) {
                onClose();
            }

        } catch (error) {
            console.error(error);
            alert('Falha ao iniciar exportação.');
        } finally {
            setLoading(null);
        }
    };

    const handleExportMobile = async () => {
        setLoading('mobile');
        try {
            const zip = new JSZip();

            // 1. Build the JSON export
            const mobileData = exportForMobile(projectId, projectName, pages);
            zip.file('project.json', JSON.stringify(mobileData, null, 2));

            // 2. Create images folder
            const imagesFolder = zip.folder('images');
            if (!imagesFolder) throw new Error('Failed to create images folder');

            // 3. Fetch and add each image
            const imageManifest = getImageManifest(pages);

            for (const { url, filename } of imageManifest) {
                try {
                    // Handle different URL formats
                    let fetchUrl = url;
                    if (url.startsWith('media://')) {
                        // Convert media:// protocol to API endpoint
                        fetchUrl = url.replace('media://', `${API_ENDPOINTS.BASE_URL}/media/`);
                    } else if (!url.startsWith('http')) {
                        // Relative URL - prepend base
                        fetchUrl = `${API_ENDPOINTS.BASE_URL}${url}`;
                    }

                    const response = await fetch(fetchUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        imagesFolder.file(filename, blob);
                    } else {
                        console.warn(`Failed to fetch image: ${url}`);
                    }
                } catch (imgError) {
                    console.warn(`Error fetching image ${url}:`, imgError);
                }
            }

            // 4. Generate and download ZIP
            const content = await zip.generateAsync({ type: 'blob' });
            const downloadUrl = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_mobile.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            onClose();
        } catch (error) {
            console.error('Mobile export error:', error);
            alert('Falha ao gerar pacote Mobile.');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Option 1: Clean Images */}
                <button
                    disabled={!!loading}
                    onClick={() => handleExport('clean_images')}
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

                {/* Option 4: Mobile Package */}
                <button
                    disabled={!!loading}
                    onClick={handleExportMobile}
                    className="group relative flex flex-col items-start p-6 rounded-xl border border-[#27272a] bg-[#27272a]/30 hover:bg-[#27272a]/80 hover:border-purple-500/50 transition-all text-left disabled:opacity-50"
                >
                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                        <Smartphone size={24} />
                    </div>
                    <h3 className="font-bold text-white mb-1">Mobile Package</h3>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        Pacote JSON para ImagineRead App com balões vetorizados e animações.
                    </p>
                    <div className="mt-auto w-full pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-medium text-purple-400 opacity-60 group-hover:opacity-100">
                        {loading === 'mobile' ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        Download ZIP
                    </div>
                </button>

            </div>
        </BaseModal>
    );
};
