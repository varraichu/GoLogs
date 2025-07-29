/**
 * @license
 * Copyright (c) 2014, 2024, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { h } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import "ojs/ojbutton";
import "ojs/ojinputtext";

type Message = {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: inputValue }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response || 'Sorry, I couldn\'t process your request.',
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
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
                    <div
                        key={message.id}
                        style={{
                            display: 'flex',
                            justifyContent: message.isUser ? 'flex-end' : 'flex-start'
                        }}
                    >
                        <div style={{
                            maxWidth: '80%',
                            padding: '8px 12px',
                            borderRadius: '16px',
                            fontSize: '14px',
                            lineHeight: '1.4',
                            background: message.isUser
                                ? 'var(--oj-core-color-brand-primary)'
                                : 'var(--oj-core-bg-color-2)',
                            color: message.isUser
                                ? 'white'
                                : 'var(--oj-core-text-color-primary)',
                            wordWrap: 'break-word'
                        }}>
                            {message.text}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start'
                    }}>
                        <div style={{
                            padding: '8px 12px',
                            borderRadius: '16px',
                            background: 'var(--oj-core-bg-color-2)',
                            color: 'var(--oj-core-text-color-secondary)',
                            fontSize: '14px'
                        }}>
                            Typing...
                        </div>
                    </div>
                )}

                <div />
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
                        style={{
                            width: '100%'
                        }}
                    />
                </div>
                <oj-c-button
                    onojAction={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    chroming="callToAction"
                    size="sm"
                    title="Send message"
                >
                    <span slot="startIcon" class="oj-ux-ico-arrow-n"></span>
                </oj-c-button>
            </div>
        </div>
    );
}