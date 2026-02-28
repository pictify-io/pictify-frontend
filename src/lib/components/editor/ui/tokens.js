// Shared design tokens for editor panel components
// Single source of truth — imported by PropertiesPanel, VariablesPanel, etc.

// Section headers: visible section titles (Appearance, Size & Position, Effects, etc.)
// font-black (900) matches left panel's font-weight: 900
export const sectionHeaderClass = 'text-[11px] font-black text-gray-900 uppercase tracking-wide';

// Field labels: individual input labels (Width, Height, Font Family, etc.)
export const fieldLabelClass = 'block text-[11px] font-bold text-gray-700 uppercase mb-1';

// Neo-brutalist input styling
export const inputBaseClass =
	'w-full text-sm border-[2px] border-gray-900 rounded-lg px-3 py-1.5 bg-white shadow-[2px_2px_0_0_#e5e5e5] focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] transition-all';

export const inputNumberClass = inputBaseClass;

export const selectClass =
	'w-full text-sm border-[2px] border-gray-900 rounded-lg px-3 py-1.5 bg-white shadow-[2px_2px_0_0_#e5e5e5] focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] transition-all';

export const buttonBaseClass =
	'w-full text-sm border-[2px] border-gray-900 rounded-lg px-3 py-1.5 bg-white shadow-[2px_2px_0_0_#e5e5e5] hover:shadow-[2px_2px_0_0_#ffc480] hover:-translate-y-0.5 focus:outline-none focus:ring-0 focus:border-gray-900 focus:shadow-[2px_2px_0_0_#ffc480] transition-all';

export const toggleSwitchClass =
	"w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-900 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black";

export const rangeInputClass =
	'w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ffc480] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-900 hover:[&::-webkit-slider-thumb]:bg-[#ffc480] [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:bg-gray-900 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-900 hover:[&::-moz-range-thumb]:bg-[#ffc480]';

// Tab styling tokens (used by PanelTabs component)
export const tabActiveClass =
	'bg-[#ffc480] text-gray-900 border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000]';
export const tabInactiveClass =
	'text-gray-500 hover:text-gray-900 border-[2px] border-transparent hover:border-gray-300';
