"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AIPromptInputProps {
    onSubmit: (prompt: string) => void;
    onClose: () => void;
    isOpen: boolean;
    isGenerating: boolean;
}

export function AIPromptInput({ onSubmit, onClose, isOpen, isGenerating }: AIPromptInputProps) {
    const [prompt, setPrompt] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!prompt.trim() || isGenerating) return;
        onSubmit(prompt);
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask AI for suggestions about this node..."
                            className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 bg-transparent text-lg placeholder:text-slate-400"
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
                            className={`h-10 w-10 rounded-xl transition-all ${prompt.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-200 dark:bg-slate-800"
                                }`}
                        >
                            {isGenerating ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                            ) : (
                                <Send className={`h-5 w-5 ${prompt.trim() ? "text-white" : "text-slate-400"}`} />
                            )}
                        </Button>
                    </div>
                </div>
                <div className="px-2 pb-1 text-xs text-slate-400 flex justify-between">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
            </div>
        </div>
    );
}
