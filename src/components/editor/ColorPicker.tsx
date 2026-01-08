"use client";

/**
 * Color Picker Component
 * 
 * Modern color picker with:
 * - Current vs New color preview (like Adobe Photoshop)
 * - Organized preset color palette
 * - Custom color input with live preview
 * - Smooth hover effects
 */

import { useState, useEffect } from "react";
import { Check, X, Pipette } from "lucide-react";

const PRESET_COLORS = [
    // Row 1: Blues & Greens
    { name: "Sky Blue", value: "#3b82f6" },
    { name: "Deep Blue", value: "#1d4ed8" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Green", value: "#22c55e" },
    { name: "Emerald", value: "#10b981" },
    // Row 2: Warm Colors
    { name: "Yellow", value: "#eab308" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Orange", value: "#f97316" },
    { name: "Red", value: "#ef4444" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Pink", value: "#ec4899" },
    // Row 3: Purples & Neutrals
    { name: "Fuchsia", value: "#d946ef" },
    { name: "Purple", value: "#a855f7" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Slate", value: "#64748b" },
    { name: "Gray", value: "#6b7280" },
];

interface ColorPickerProps {
    selectedColor?: string;
    onColorChange: (color: string) => void;
    onClose?: () => void;
}

export function ColorPicker({
    selectedColor = "#3b82f6",
    onColorChange,
    onClose,
}: ColorPickerProps) {
    const [previewColor, setPreviewColor] = useState(selectedColor);
    const [customColor, setCustomColor] = useState(selectedColor);
    const [hoveredColor, setHoveredColor] = useState<string | null>(null);

    // The color shown in preview (hover takes priority)
    const displayNewColor = hoveredColor || previewColor;

    useEffect(() => {
        setPreviewColor(selectedColor);
        setCustomColor(selectedColor);
    }, [selectedColor]);

    const handleColorSelect = (color: string) => {
        // Instantly apply the color and close picker
        onColorChange(color);
    };

    const handleApply = () => {
        onColorChange(previewColor);
    };

    const handleCustomColorChange = (value: string) => {
        setCustomColor(value);
        // Instantly apply if valid hex color
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            setPreviewColor(value);
            onColorChange(value);
        }
    };

    // Get contrasting text color for a background
    const getContrastColor = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? "#1e293b" : "#ffffff";
    };

    return (
        <div className="z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Pipette className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Color Picker
                    </span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-4 w-4 text-slate-400" />
                    </button>
                )}
            </div>

            {/* Preview Panel - Current vs New (Photoshop style) */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    Preview
                </div>
                <div className="flex rounded-lg overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                    {/* New Color (top/left) */}
                    <div
                        className="flex-1 h-16 flex items-center justify-center transition-colors duration-200"
                        style={{ backgroundColor: displayNewColor }}
                    >
                        <span
                            className="text-xs font-medium opacity-80"
                            style={{ color: getContrastColor(displayNewColor) }}
                        >
                            New
                        </span>
                    </div>
                    {/* Divider */}
                    <div className="w-px bg-slate-300 dark:bg-slate-600" />
                    {/* Current Color (bottom/right) */}
                    <div
                        className="flex-1 h-16 flex items-center justify-center"
                        style={{ backgroundColor: selectedColor }}
                    >
                        <span
                            className="text-xs font-medium opacity-60"
                            style={{ color: getContrastColor(selectedColor) }}
                        >
                            Current
                        </span>
                    </div>
                </div>
            </div>

            {/* Color Swatches */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    Preset Colors
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => handleColorSelect(color.value)}
                            onMouseEnter={() => setHoveredColor(color.value)}
                            onMouseLeave={() => setHoveredColor(null)}
                            className={`
                                relative h-8 w-8 rounded-lg transition-all duration-150 
                                hover:scale-110 hover:shadow-lg hover:z-10
                                ${previewColor === color.value
                                    ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white ring-offset-white dark:ring-offset-slate-900"
                                    : "border border-slate-200 dark:border-slate-700"
                                }
                            `}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                        >
                            {previewColor === color.value && (
                                <Check
                                    className="absolute inset-0 m-auto h-4 w-4 drop-shadow-md"
                                    style={{ color: getContrastColor(color.value) }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Color Section */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    Custom Color
                </div>
                <div className="flex items-center gap-2">
                    {/* Native Color Picker */}
                    <div className="relative">
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div
                            className="h-10 w-10 rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-inner cursor-pointer hover:scale-105 transition-transform"
                            style={{ backgroundColor: customColor }}
                        />
                    </div>
                    {/* Hex Input */}
                    <input
                        type="text"
                        value={customColor.toUpperCase()}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        className="flex-1 h-10 px-3 text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="#000000"
                        maxLength={7}
                    />
                </div>
            </div>

            {/* Actions - simplified, just close button */}
            {onClose && (
                <div className="flex justify-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="px-6 h-9 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
