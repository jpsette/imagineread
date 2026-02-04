/**
 * DeviceSelector
 * 
 * Device type selector component for mobile/tablet preview.
 */

import React from 'react';
import { Smartphone, Tablet, MessageCircle } from 'lucide-react';

// Device configurations - shared with parent
export const DEVICES = {
    mobile: {
        name: 'Mobile',
        width: 180,
        height: 400,
        realWidth: 360,
        realHeight: 800,
        borderRadius: '1.5rem',
        hasNotch: false,
        icon: Smartphone
    },
    tablet: {
        name: 'Tablet',
        width: 320,
        height: 512,
        realWidth: 800,
        realHeight: 1280,
        borderRadius: '1rem',
        hasNotch: false,
        icon: Tablet
    }
} as const;

export type DeviceType = keyof typeof DEVICES;

interface DeviceSelectorProps {
    selectedDevice: DeviceType;
    onDeviceChange: (device: DeviceType) => void;
    balloonCount: number;
}

export const DeviceSelector = React.memo<DeviceSelectorProps>(({
    selectedDevice,
    onDeviceChange,
    balloonCount
}) => {
    return (
        <div className="flex items-center justify-center gap-2 border-x border-zinc-700 px-4 py-2" style={{ backgroundColor: '#1f1f23' }}>
            {(Object.keys(DEVICES) as DeviceType[]).map((deviceKey) => {
                const d = DEVICES[deviceKey];
                const Icon = d.icon;
                const isSelected = selectedDevice === deviceKey;
                return (
                    <button
                        key={deviceKey}
                        onClick={() => onDeviceChange(deviceKey)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-surface hover:bg-border-color text-text-secondary'
                            }`}
                    >
                        <Icon size={14} />
                        <span>{d.name}</span>
                        <span className="text-[10px] opacity-70">{d.realWidth}×{d.realHeight}</span>
                    </button>
                );
            })}

            {balloonCount > 0 && (
                <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-surface rounded text-[10px] text-text-secondary">
                    <MessageCircle size={10} />
                    <span>{balloonCount}</span>
                </div>
            )}
        </div>
    );
});

DeviceSelector.displayName = 'DeviceSelector';
