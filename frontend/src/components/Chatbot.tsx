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
import { query } from "express";

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
                body: JSON.stringify({ query: inputValue }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            console.log('repsons:', data);

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
                        <div
                            style={{
                                maxWidth: '75%',
                                padding: '10px 14px',
                                borderRadius: message.isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                background: message.isUser
                                    ? '#757575ff'
                                    : '#f1f3f5',
                                color: message.isUser ? '#ffffff' : '#333',
                                fontSize: '14px',
                                lineHeight: '1.4',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                wordWrap: 'break-word',
                                border: message.isUser ? 'none' : '1px solid #e0e0e0'
                            }}
                        >
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
                        {/* Bot Avatar */}
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

                            {/* Message tail */}
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
                    style={{ backgroundColor: 'var(--oj-core-color-brand-primary)' }}
                >
                    <span slot="startIcon" class="oj-ux-ico-send-message"></span>
                </oj-c-button>
            </div>
        </div>
    );
}