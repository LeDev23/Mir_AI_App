import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const userId = 'user123';
    const chatWindowRef = useRef(null);
    const inputRef = useRef(null);
    const cancelTokenSource = useRef(null);

    const sendMessage = useCallback(async () => {
        if (!message.trim()) return;

        const userMessage = {
            sender: 'user',
            text: message,
            timestamp: new Date().toISOString()
        };
        setConversation((prev) => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);

        cancelTokenSource.current = axios.CancelToken.source();

        try {
            const response = await axios.post(
                'http://localhost:5000/api/chat',
                { message, userId },
                { cancelToken: cancelTokenSource.current.token }
            );

            const botMessage = {
                sender: 'bot',
                text: response.data.reply,
                timestamp: new Date().toISOString()
            };
            setConversation((prev) => [...prev, botMessage]);
        } catch (error) {
            const errorText = axios.isCancel(error)
                ? 'Request was cancelled.'
                : '❌ Oops! Something went wrong. Please try again.';
            const errorMessage = {
                sender: 'bot',
                text: errorText,
                timestamp: new Date().toISOString()
            };
            setConversation((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    }, [message, userId]);

    const stopMessage = () => {
        if (cancelTokenSource.current) {
            cancelTokenSource.current.cancel('Operation canceled by the user.');
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setConversation([]);
        setMessage('');
        inputRef.current?.focus();
    };

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [conversation]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleButtonClick = () => {
        if (isLoading) {
            stopMessage();
        } else {
            sendMessage();
        }
    };

    const formatTime = (isoString) =>
        new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="phone-wrapper">
            <div className="chat-container">
                <div className="chat-header">
                    <img
                        src="https://scontent.fmnl13-4.fna.fbcdn.net/v/t1.15752-9/480657310_630716836372638_4796893253857913445_n.jpg"
                        alt="Logo"
                        className="chat-logo"
                    />
                    Mir AI
                    <button className="clear-chat" onClick={clearChat} disabled={isLoading}>
                        🗑️ Clear Chat
                    </button>
                </div>
                <div className="chat-window" ref={chatWindowRef}>
                    {conversation.map((msg, index) => (
                        <div key={index} className={`message-row ${msg.sender}`}>
                            <div className="avatar">
                                {msg.sender === 'user' ? '🧑' : '🤖'}
                            </div>
                            <div className={`message ${msg.sender}`}>
                                <div className="message-text">{msg.text}</div>
                                <div className="message-time">{formatTime(msg.timestamp)}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message-row bot">
                            <div className="avatar">🤖</div>
                            <div className="message bot">
                                <div className="loading-dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="input-container">
                    <textarea
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={isLoading}
                        rows={1}
                        className="chat-input"
                    />
                    <button
                        onClick={handleButtonClick}
                        disabled={!message.trim() && !isLoading}
                    >
                        {isLoading ? 'Stop' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
