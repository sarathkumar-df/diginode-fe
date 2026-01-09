"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, ChevronDown, Palette, Code, TestTube, BarChart3, Megaphone, LineChart, Target, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

// Persona options for different team roles - clean icons, no emojis
const PERSONAS = [
    { id: "general", label: "General", icon: Target },
    { id: "digital_media", label: "Digital Media", icon: Megaphone },
    { id: "ui_ux", label: "UI/UX", icon: Palette },
    { id: "development", label: "Development", icon: Code },
    { id: "testing", label: "QA & Testing", icon: TestTube },
    { id: "product_management", label: "Product", icon: BarChart3 },
    { id: "marketing", label: "Marketing", icon: Layout },
    { id: "data_analytics", label: "Analytics", icon: LineChart },
] as const;

type PersonaId = typeof PERSONAS[number]["id"];

interface AIPromptInputProps {
    onSubmit: (prompt: string, persona: PersonaId) => void;
    onClose: () => void;
    isOpen: boolean;
    isGenerating: boolean;
}

export function AIPromptInput({ onSubmit, onClose, isOpen, isGenerating }: AIPromptInputProps) {
    const [prompt, setPrompt] = useState("");
    const [selectedPersona, setSelectedPersona] = useState<PersonaId>("general");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const currentPersona = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];
    const PersonaIcon = currentPersona.icon;

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!prompt.trim() || isGenerating) return;
        onSubmit(prompt, selectedPersona);
        setPrompt("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === "Escape") {
            onClose();
        }
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Input Area */}
                <div className="p-3 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <div className="flex-1 relative">
                            <Textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask AI for suggestions about this node..."
                                className="min-h-[50px] max-h-[150px] resize-none border-0 focus-visible:ring-0 bg-transparent text-base placeholder:text-slate-400"
                                disabled={isGenerating}
                            />
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={onClose}
                                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                disabled={isGenerating}
                            >
                                <X className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button
                                size="icon"
                                onClick={handleSubmit}
                                disabled={!prompt.trim() || isGenerating}
                                className={`h-9 w-9 rounded-xl transition-all ${prompt.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-200 dark:bg-slate-800"
                                    }`}
                            >
                                {isGenerating ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                                ) : (
                                    <Send className={`h-4 w-4 ${prompt.trim() ? "text-white" : "text-slate-400"}`} />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Footer with persona selector */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 px-2 text-slate-500 hover:text-slate-700"
                                >
                                    <PersonaIcon className="h-3.5 w-3.5" />
                                    <span>{currentPersona.label}</span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44">
                                <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                                    AI responds as
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {PERSONAS.map((persona) => {
                                    const Icon = persona.icon;
                                    const isSelected = selectedPersona === persona.id;
                                    return (
                                        <DropdownMenuItem
                                            key={persona.id}
                                            onClick={() => setSelectedPersona(persona.id)}
                                            className={`gap-2 text-sm ${isSelected ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : ""}`}
                                        >
                                            <Icon className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                                            <span>{persona.label}</span>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <span className="text-[11px] text-slate-400">
                            Enter to send · Shift+Enter for new line
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
