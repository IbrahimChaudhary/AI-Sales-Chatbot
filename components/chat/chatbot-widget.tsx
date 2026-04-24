"use client";

import { Message } from "./message";
import { ChatInput } from "./chat-input";
import { Card } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatbotWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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
      id: Date.now().toString(),
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
        headers: {
          "Content-Type": "application/json",
        },
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
      const assistantMessageId = (Date.now() + 1).toString();

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("0:")) {
              let content = line.substring(2);

              try {
                content = JSON.parse(content);
              } catch (e) {
                if (content.startsWith('"')) {
                  content = content.substring(1);
                }
                if (content.endsWith('"')) {
                  content = content.substring(0, content.length - 1);
                }
                content = content
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\`/g, '`')
                  .replace(/\\\\/g, '\\');
              }

              assistantMessage += content;

              setMessages((prev) => {
                const withoutLast = prev.filter((m) => m.id !== assistantMessageId);
                const newMessage = {
                  id: assistantMessageId,
                  role: "assistant" as const,
                  content: assistantMessage,
                };

                return [...withoutLast, newMessage];
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-full md:w-[450px] max-w-[450px] mx-4 md:mx-0 shadow-2xl rounded-lg overflow-hidden z-50 transition-all ${isMinimized ? 'h-[60px]' : 'h-[600px]'}`}>
          <Card className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-semibold">AI Sales Analyst</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                      <MessageCircle className="h-12 w-12 text-muted-foreground" />
                      <div className="text-muted-foreground">
                        <p className="font-medium mb-2">Ask me anything!</p>
                        <div className="space-y-1 text-xs">
                          <p>"Sales trends last 6 months"</p>
                          <p>"Top categories?"</p>
                          <p>"Show regional breakdown"</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <Message key={message.id} role={message.role} content={message.content} />
                      ))}
                      {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Analyzing...</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-background">
                  <ChatInput
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                  />
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
