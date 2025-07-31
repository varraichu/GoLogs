import { h } from "preact";
import { useState } from "preact/hooks";
import "ojs/ojbutton";
import "ojs/ojinputtext";

type Message = {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    saved?: boolean;
    savedId?: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export function Chatbot({ isOpen, onClose }: Props) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! How can I assist you today?',
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState<{ _id: string; prompt: string }[]>([]);

    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ query: inputValue }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response || 'Sorry, I couldn\'t process your request.',
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I\'m having trouble connecting. Please try again later.',
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (event: any) => {
        setInputValue(event.detail.value);
    };

    const savePrompt = async (text: string) => {
        const res = await fetch('http://localhost:3001/api/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt: text }),
        });
        return res.json();
    };

    const fetchSavedPrompts = async () => {
        const res = await fetch('http://localhost:3001/api/prompt', {
            credentials: 'include',
        });
        return res.json();
    };

    const unsavePrompt = async (id: string) => {
        const res = await fetch(`http://localhost:3001/api/prompt/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return res.json();
    };

    const toggleSave = async (msg: Message) => {
        if (msg.saved && msg.savedId) {
            await unsavePrompt(msg.savedId);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, saved: false, savedId: undefined } : m));
        } else {
            const res = await savePrompt(msg.text);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, saved: true, savedId: res.prompt._id } : m));
        }
    };

    const loadSavedPrompts = async () => {
        try {
            const data = await fetchSavedPrompts();
            const saved = data.prompts || [];
            setSavedPrompts(saved);
            setShowSaved(true);

            setMessages(prev =>
                prev.map(msg => {
                    const match = saved.find((p: { _id: string; prompt: string }) => p.prompt === msg.text);
                    return match ? { ...msg, saved: true, savedId: match._id } : msg;
                })
            );
        } catch (error) {
            console.error("Failed to load saved prompts", error);
        }
    };


    const SavedPromptList = () => (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'white', zIndex: 1001, padding: '16px', overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Saved Prompts</h3>
                <oj-c-button onojAction={() => setShowSaved(false)} chroming="borderless">
                    <span slot="startIcon" class="oj-ux-ico-close"></span>
                </oj-c-button>
            </div>
            {savedPrompts.length === 0 ? (
                <p>No saved prompts</p>
            ) : (
                savedPrompts.map(prompt => (
                    <div key={prompt._id} style={{ margin: '8px 0', borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>
                        <span>{prompt.prompt}</span>
                        <oj-c-button
                            onojAction={() => unsavePrompt(prompt._id).then(() => loadSavedPrompts())}
                            size="xs"
                            chroming="borderless"
                            title="Remove"
                            style={{ marginLeft: '12px' }}
                        >
                            <span slot="startIcon" class="oj-ux-ico-trash"></span>
                        </oj-c-button>
                    </div>
                ))
            )}
        </div>
    );

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: '500px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            zIndex: '1000',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--oj-core-font-family)'
        }}>
            {showSaved && <SavedPromptList />}

            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--oj-core-divider-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '12px 12px 0 0',
                background: 'var(--oj-core-bg-color-1)'
            }}>
                <h3 style={{
                    margin: '0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--oj-core-text-color-primary)'
                }}>
                    Chat Assistant
                </h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <oj-c-button
                        display="icons"
                        onojAction={loadSavedPrompts}
                        chroming="borderless"
                        size="sm"
                        title="View saved prompts"
                    >
                        <span slot="startIcon" class="oj-ux-ico-star"></span>
                    </oj-c-button>
                    <oj-c-button
                        display="icons"
                        onojAction={onClose}
                        chroming="borderless"
                        size="sm"
                        title="Close chat"
                    >
                        <span slot="startIcon" class="oj-ux-ico-close"></span>
                    </oj-c-button>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: '1',
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {messages.map((message) => (
                    <div key={message.id} style={{
                        display: 'flex',
                        justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                        gap: '8px',
                        alignItems: 'flex-start'
                    }}>
                        {message.isUser && (
                            <oj-c-button
                                onojAction={() => toggleSave(message)}
                                size="xs"
                                chroming="borderless"
                                title={message.saved ? "Unsave" : "Save"}
                                style={{
                                    alignSelf: 'center',
                                    flexShrink: 0,
                                    marginTop: '4px'
                                }}
                            >
                                <span slot="startIcon" class={message.saved ? "oj-ux-ico-star-full" : "oj-ux-ico-star"}></span>
                            </oj-c-button>
                        )}

                        <div style={{
                            maxWidth: '75%',
                            padding: '10px 14px',
                            borderRadius: message.isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: message.isUser ? '#757575ff' : '#f1f3f5',
                            color: message.isUser ? '#ffffff' : '#333',
                            fontSize: '14px',
                            position: 'relative'
                        }}>
                            {message.text}
                        </div>
                    </div>

                ))}

                {isLoading && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-end',
                        gap: '8px'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--oj-core-color-brand-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            color: 'white',
                            fontWeight: 'bold',
                            flexShrink: '0'
                        }}>
                            🤖
                        </div>
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '18px 18px 18px 4px',
                            background: '#f8f9fa',
                            color: '#666',
                            fontSize: '14px',
                            border: '1px solid #e9ecef',
                            position: 'relative'
                        }}>
                            <span style={{
                                display: 'inline-block',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }}>
                                Typing...
                            </span>
                            <div style={{
                                position: 'absolute',
                                bottom: '0',
                                left: '-4px',
                                width: '0',
                                height: '0',
                                borderStyle: 'solid',
                                borderWidth: '0 8px 8px 0',
                                borderColor: 'transparent #f8f9fa transparent transparent'
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid var(--oj-core-divider-color)',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end'
            }}>
                <div style={{ flex: '1' }}>
                    <oj-input-text
                        value={inputValue}
                        onvalueChanged={handleInputChange}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        style={{ width: '100%' }}
                    />
                </div>
                <oj-c-button
                    onojAction={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    chroming="callToAction"
                    size="sm"
                    title="Send message"
                    style={{ backgroundColor: 'var(--oj-core-color-brand-primary)' }}
                >
                    <span slot="startIcon" class="oj-ux-ico-send-message"></span>
                </oj-c-button>
            </div>
        </div>
    );
}
