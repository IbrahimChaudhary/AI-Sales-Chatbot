"use client";

import { Message } from "./message";
import { ChatInput } from "./chat-input";
import { Card } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      const assistantMessageId = crypto.randomUUID();
      let buffer = "";

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          // Append the new chunk to whatever was leftover from last time
          buffer += decoder.decode(value, { stream: true });

          // Split into lines, but keep the last (potentially incomplete) line in the buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("0:")) continue;

            const payload = line.slice(2);
            let content: string;

            try {
              content = JSON.parse(payload);
            } catch {
              // Malformed line — skip it rather than producing garbled output
              console.warn("Skipping unparseable chunk:", payload);
              continue;
            }

            assistantMessage += content;

            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.id === assistantMessageId) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: assistantMessage },
                ];
              }
              return [
                ...prev,
                {
                  id: assistantMessageId,
                  role: "assistant" as const,
                  content: assistantMessage,
                },
              ];
            });
          }
        }

        // Flush any remaining complete line in the buffer at end of stream
        if (buffer.startsWith("0:")) {
          const payload = buffer.slice(2);
          try {
            const content = JSON.parse(payload);
            assistantMessage += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.id === assistantMessageId) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: assistantMessage },
                ];
              }
              return [
                ...prev,
                {
                  id: assistantMessageId,
                  role: "assistant" as const,
                  content: assistantMessage,
                },
              ];
            });
          } catch {
            console.warn("Skipping final unparseable chunk:", buffer);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold">AI Sales Analyst</h1>
        <p className="text-muted-foreground">
          Ask questions about sales data, request forecasts, or create
          visualizations
        </p>
      </div>

      {/* Messages Container */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">Welcome! Try asking:</p>
              <div className="space-y-2 text-sm">
                <p>"Show me sales trends for the last 6 months"</p>
                <p>"What are the top-selling categories?"</p>
                <p>"Forecast next quarter's revenue"</p>
                <p>"Show regional sales breakdown as a pie chart"</p>
                <p>"Detect any anomalies in recent sales"</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Card>

      {/* Input */}
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
