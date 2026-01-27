// --- STYLES CONSTANTS ---
export const H_HEIGHT = "h-[38px]"; // Standard Height

export const BTN_BASE = `w-full ${H_HEIGHT} px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 select-none border`;

export const BTN_PRIMARY = `${BTN_BASE} bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-sm active:transform active:scale-[0.98]`;
export const BTN_DISABLED = `${BTN_BASE} bg-[#333] text-gray-500 border-transparent cursor-not-allowed opacity-50`;

// Success/Done State (Ghost Green) - Standardized for all sections
// Fix: Inherit BTN_BASE to ensure padding (px-4), rounded-md, and transitions match Primary buttons
export const BTN_SUCCESS = `${BTN_BASE} bg-emerald-600/10 text-emerald-500 border-emerald-600/30 hover:bg-emerald-600/20 active:bg-emerald-600/25 cursor-default !w-auto flex-1`;
export const BTN_SUCCESS_CLICKABLE = `${BTN_SUCCESS} cursor-pointer hover:bg-emerald-600/30 active:scale-[0.98]`;

// Secondary Actions (Gray)
export const BTN_SECONDARY = `${BTN_BASE} bg-zinc-700 hover:bg-zinc-600 text-zinc-300 border-zinc-600`;

// Eye Button
export const BTN_EYE = (active: boolean) => `w-12 ${H_HEIGHT} flex items-center justify-center rounded border transition-colors ${active ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-zinc-800 text-zinc-500 border-zinc-700'} hover:text-white`;
