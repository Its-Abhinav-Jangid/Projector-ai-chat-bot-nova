"use client";
import RcMascot from "@/components/Greeting";
import React, { useState, useEffect, useRef } from "react";
import {
  FiSend,
  FiUser,
  FiCpu,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatbotDemo() {
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const messagesEndRef = useRef(null);

  // Demo responses for offline mode
  const demoResponses = [
    "Hello! I'm Nova, your pit-crew AI 🏎️. Ask me anything about remote-controlled cars and I’ll race to answer!",
    "Vroom vroom! 🚗 That’s a great question — let me steer you through the answer.",
    "Alright, let’s pop the hood and break this down into simple steps.",
    "Nice! I’ve got a cool fact about RC cars that will turbocharge your knowledge.",
    "Fantastic question! This reminds me of how speed, control, and design all work together in an RC car.",
    "Sure thing! Let’s make this as easy as tuning up your RC car before a race 🛠️.",
    "Ooh, that’s a tricky corner — but I know how to handle the curves! Here’s my explanation...",
  ];

  // Example prompts for teachers to demonstrate
  const examplePrompts = [
    "List 3 secret tricks to make an RC car faster.",
    "Explain how a remote-controlled car receives signals from the controller",
    "Explain how RC cars turn without a steering wheel.",
    "Describe the parts inside a remote-controlled car and what they do",
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with bot greeting
  useEffect(() => {
    const greeting = {
      id: 1,
      content:
        "🏎️ I'm Nova, your pit-crew AI assistant. I'm here to share tips, facts, and fun ideas about remote-controlled cars. What RC adventure should we start with today?",
      role: "assistant",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setTimeout(() => {
      setMessages([greeting]);
      messagesRef.current = [greeting];
    }, 8000);
  }, []);

  // Handle sending messages
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: input,
      role: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    messagesRef.current = [...messagesRef.current, userMessage];
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    if (demoMode) {
      // Demo mode - use canned responses
      setTimeout(() => {
        const randomResponse =
          demoResponses[Math.floor(Math.random() * demoResponses.length)];
        const botMessage = {
          id: Date.now() + 1,
          content: randomResponse,
          role: "assistant",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, botMessage]);
        messagesRef.current = [...messagesRef.current, botMessage];
        setIsTyping(false);
      }, 1500 + Math.random() * 1000); // Random delay 1.5-2.5s
    } else {
      // API mode - call mock backend
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesRef.current }),
        });
        const data = await response.json();
        console.log(data);

        const botMessage = {
          id: Date.now() + 1,
          content: data.content,
          role: "assistant",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, botMessage]);
        messagesRef.current = [...messagesRef.current, botMessage];
        setIsTyping(false);
      } catch (error) {
        console.error("Error calling API:", error);
        setIsTyping(false);
      }
    }
  };

  // Handle keyboard events
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Fill example prompt
  const fillExample = (prompt) => {
    setInput(prompt);
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-4 bg-indigo-800/50 rounded-2xl max-w-xs animate-fade-in">
      <FiCpu className="text-indigo-300 text-xl" />
      <div className="flex space-x-1">
        <div
          className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
      <span className="text-indigo-300 text-lg ml-2">Thinking...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex flex-col">
      <RcMascot
        demoAnimation={true}
        greetingText="Ready to race into learning!"
      />
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
              <FiCpu className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Nova AI Assistant
              </h1>
              <p className="text-blue-200 text-lg">
                Intelligent Conversation Partner
              </p>
            </div>
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex items-center space-x-3">
            <span className="text-white text-lg">Demo Mode</span>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {demoMode ? (
                <FiToggleRight className="text-green-400 text-3xl" />
              ) : (
                <FiToggleLeft className="text-gray-400 text-3xl" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Example Prompts */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-white text-lg mb-3">Quick Start Examples:</p>
          <div className="flex flex-wrap gap-3">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => fillExample(prompt)}
                className="bg-blue-600/70 hover:bg-blue-500/70 text-white px-4 py-2 rounded-lg text-base transition-colors backdrop-blur-sm border border-blue-400/30"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-4 animate-fade-in ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiCpu className="text-white text-xl" />
                </div>
              )}

              <div
                className={`max-w-3xl ${
                  message.role === "user" ? "order-1" : ""
                }`}
              >
                <div
                  className={`p-5 rounded-2xl shadow-lg backdrop-blur-sm border text-lg leading-relaxed ${
                    message.role === "user"
                      ? "bg-blue-500/80 text-white border-blue-400/30 rounded-br-md"
                      : "bg-indigo-800/60 text-white border-indigo-600/30 rounded-bl-md"
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        return <span {...props}>{children}</span>;
                      },
                      pre({ node, children, ...props }) {
                        return <div {...props}>{children}</div>;
                      },
                      table({ children }) {
                        return (
                          <div className="overflow-x-auto shadow-md rounded-lg mb-4">
                            <table className="min-w-full divide-y divide-gray-700">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children }) {
                        return (
                          <thead className="bg-gray-800">{children}</thead>
                        );
                      },
                      tbody({ children }) {
                        return (
                          <tbody className="divide-y divide-gray-700">
                            {children}
                          </tbody>
                        );
                      },
                      tr({ children }) {
                        return (
                          <tr className="hover:bg-gray-800/50 transition-colors">
                            {children}
                          </tr>
                        );
                      },
                      th({ children }) {
                        return (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            {children}
                          </th>
                        );
                      },
                      td({ children }) {
                        return (
                          <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                            {children}
                          </td>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <p
                  className={`text-sm text-blue-200 mt-2 ${
                    message.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {message.timestamp}
                </p>
              </div>

              {message.role === "user" && (
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 order-2">
                  <FiUser className="text-white text-xl" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <FiCpu className="text-white text-xl" />
              </div>
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white text-lg placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent"
                rows="3"
                disabled={isTyping}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white p-4 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-lg disabled:cursor-not-allowed"
            >
              <FiSend className="text-2xl" />
            </button>
          </div>
          <p className="text-blue-200 text-sm mt-2 text-center">
            {demoMode
              ? "Demo Mode Active - Using saved Responses"
              : "API Mode - Using Real Backend"}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
