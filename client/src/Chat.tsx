import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CursorEffect } from '@/components/CursorEffect';
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import "./App.css";
import path from "path";

type TextResponse = {
    text: string;
    user: string;
    attachments?: { url: string; contentType: string; title: string }[];
};

export default function Chat() {
    const { agentId } = useParams();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<TextResponse[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const mutation = useMutation({
        mutationFn: async (text: string) => {
            const formData = new FormData();
            formData.append("text", text);
            formData.append("userId", "user");
            formData.append("roomId", `default-room-${agentId}`);

            if (selectedFile) {
                formData.append("file", selectedFile);
            }

            const res = await fetch(`/api/${agentId}/message`, {
                method: "POST",
                body: formData,
            });
            return res.json() as Promise<TextResponse[]>;
        },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, ...data]);
            setSelectedFile(null);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() && !selectedFile) return;

        // Add user message immediately to state
        const userMessage: TextResponse = {
            text: input,
            user: "user",
            attachments: selectedFile ? [{ url: URL.createObjectURL(selectedFile), contentType: selectedFile.type, title: selectedFile.name }] : undefined,
        };
        setMessages((prev) => [...prev, userMessage]);

        mutation.mutate(input);
        setInput("");
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-screen w-full">
            <CursorEffect />
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length > 0 ? (
                        <>
                            {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`text-left flex ${
                                    message.user === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[80%] message-bubble rounded-2xl px-6 py-4 ${
                                        message.user === "user"
                                            ? "bg-primary/10 text-primary neon-text"
                                            : "bg-muted/50 text-foreground"
                                    }`}
                                >
                                    {message.text}
                                    {message.attachments?.map((attachment, i) => (
                                        attachment.contentType.startsWith('image/') && (
                                            <img
                                                key={i}
                                                src={message.user === "user"
                                                    ? attachment.url
                                                    : attachment.url.startsWith('http')
                                                        ? attachment.url
                                                        : `http://localhost:3000/media/generated/${attachment.url.split('/').pop()}`
                                                }
                                                alt={attachment.title || "Attached image"}
                                                className="mt-2 max-w-full rounded-lg"
                                            />
                                        )
                                    ))}
                                 </div>
                            </div>
                            ))}
                            
                            {mutation.isPending && (
                                <div className="text-left flex justify-start animate-in fade-in slide-in-from-bottom-4">
                                    <div className="max-w-[80%] message-bubble rounded-2xl px-6 py-4 bg-muted/50 text-foreground">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-2">
                                                <span className="animate-pulse-fast h-2 w-2 rounded-full bg-primary/60" />
                                                <span className="animate-pulse-med h-2 w-2 rounded-full bg-primary/60" />
                                                <span className="animate-pulse-slow h-2 w-2 rounded-full bg-primary/60" />
                                            </div>
                                            <span className="text-sm text-muted-foreground">thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground neon-text opacity-50 mt-20">
                            <div className="text-4xl mb-4">💭</div>
                            <div className="text-xl">Start a conversation...</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-border/50 backdrop-blur-xl bg-background/80 p-6">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1"
                            disabled={mutation.isPending}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleFileSelect}
                            disabled={mutation.isPending}
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "..." : "Send"}
                        </Button>
                    </form>
                    {selectedFile && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            Selected file: {selectedFile.name}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
