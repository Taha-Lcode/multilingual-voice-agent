import { useState, useRef, useEffect } from 'react';
import VoiceOrb from '../components/VoiceOrb';
import ChatMessage from '../components/ChatMessage';
import FeatureCard from '../components/FeatureCard';
import { sendToN8n } from '../api/n8n';

const VoiceAgent = () => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [messages, setMessages] = useState([]);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [showChat, setShowChat] = useState(false);

    const mediaRecorderRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioChunksRef = useRef([]);
    const messagesEndRef = useRef(null);
    const finalTranscriptRef = useRef('');
    const silenceTimerRef = useRef(null);
    const noSpeechTimerRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentTranscript]);

    // Show chat when there are messages or when listening
    useEffect(() => {
        if (messages.length > 0 || isListening) {
            setShowChat(true);
        }
    }, [messages.length, isListening]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    finalTranscriptRef.current += finalTranscript;
                }

                setCurrentTranscript(finalTranscriptRef.current + interimTranscript);

                if (noSpeechTimerRef.current) {
                    clearTimeout(noSpeechTimerRef.current);
                    noSpeechTimerRef.current = null;
                }

                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                }

                silenceTimerRef.current = setTimeout(() => {
                    console.log('Auto-stopping due to silence...');
                    stopRecording();
                }, 3000);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    console.log('No speech detected, stopping...');
                    stopRecording();
                }
            };

            recognitionRef.current.onend = () => {
                console.log('Speech recognition ended');
            };
        }
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            finalTranscriptRef.current = '';
            setCurrentTranscript('');

            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    console.log('Speech recognition started');
                } catch (error) {
                    console.error('Speech recognition start error:', error);
                }
            }

            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.start();
            setIsListening(true);

            noSpeechTimerRef.current = setTimeout(() => {
                console.log('No speech detected after 10 seconds, stopping...');
                stopRecording();
            }, 10000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Please allow microphone access to use voice features');
        }
    };

    const stopRecording = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (noSpeechTimerRef.current) {
            clearTimeout(noSpeechTimerRef.current);
            noSpeechTimerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();

            mediaRecorderRef.current.onstop = async () => {
                if (recognitionRef.current) {
                    try {
                        recognitionRef.current.stop();
                    } catch (error) {
                        console.error('Error stopping recognition:', error);
                    }
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const spokenText = finalTranscriptRef.current.trim() || currentTranscript.trim();

                console.log('Spoken text:', spokenText);

                if (!spokenText) {
                    console.log('No speech detected, not sending to n8n');
                    setIsListening(false);
                    setCurrentTranscript('');
                    finalTranscriptRef.current = '';

                    const tracks = mediaRecorderRef.current.stream.getTracks();
                    tracks.forEach(track => track.stop());
                    return;
                }

                if (spokenText) {
                    setMessages(prev => [...prev, {
                        type: 'user',
                        message: spokenText,
                        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    }]);
                }

                setIsListening(false);
                setIsProcessing(true);
                setCurrentTranscript('');

                try {
                    const response = await sendToN8n(audioBlob, spokenText);
                    console.log('Response from n8n:', response);

                    setMessages(prev => [...prev, {
                        type: 'agent',
                        message: response.text || 'Response received',
                        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    }]);

                    if (response.audioUrl) {
                        console.log('🔊 Starting audio playback');

                        const audio = new Audio(response.audioUrl);
                        setIsPlaying(true);

                        audio.onended = () => {
                            console.log('✅ Audio ended');
                            if (response.audioUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(response.audioUrl);
                            }
                            setIsPlaying(false);
                        };

                        audio.onerror = (error) => {
                            console.error('❌ Audio error:', error);
                            if (response.audioUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(response.audioUrl);
                            }
                            setIsPlaying(false);
                        };

                        try {
                            await audio.play();
                        } catch (playError) {
                            console.error('❌ Play failed:', playError);
                            setIsPlaying(false);
                        }
                    }
                } catch (error) {
                    console.error('Error in workflow:', error);
                    setMessages(prev => [...prev, {
                        type: 'agent',
                        message: `Error: ${error.message || 'Connection failed.'}`,
                        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    }]);
                } finally {
                    setIsProcessing(false);
                    finalTranscriptRef.current = '';
                }

                const tracks = mediaRecorderRef.current.stream.getTracks();
                tracks.forEach(track => track.stop());
            };
        }
    };

    const handleOrbClick = () => {
        if (isProcessing || isPlaying) {
            console.log('Click blocked - processing or playing');
            return;
        }

        console.log('Orb clicked - isListening:', isListening);

        if (isListening) {
            console.log('Stopping recording...');
            stopRecording();
        } else {
            console.log('Starting recording...');
            startRecording();
        }
    };

    return (
        <div className="h-screen w-screen fixed inset-0 overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
            {/* Starry background */}
            <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            opacity: Math.random() * 0.5 + 0.2
                        }}
                    />
                ))}
            </div>

            {/* Color Accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* ✅ Main Content - Flex Column Layout */}
            <div className="relative z-10 h-full w-full flex flex-col">
                {/* ✅ Chat Box - Grows from top, max 65vh */}
                <div
                    className={`w-full transition-all duration-700 ease-in-out px-8 ${
                        showChat
                            ? 'opacity-100 translate-y-0 pt-8'
                            : 'opacity-0 -translate-y-10 pointer-events-none pt-0'
                    }`}
                    style={{
                        flexGrow: showChat ? 1 : 0,
                        flexShrink: 0,
                        maxHeight: showChat ? '65vh' : '0',
                    }}
                >
                    <div className="max-w-xl mx-auto bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-500/20 h-full flex flex-col">
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-4 border-b border-gray-700/50 flex-shrink-0">
                            <h3 className="text-white font-semibold text-lg">Voice Assistant</h3>
                            <p className="text-gray-400 text-xs mt-1">Multilingual AI Chat</p>
                        </div>

                        {/* ✅ Chat Messages - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-600/40 scrollbar-track-transparent">
                            {messages.length === 0 && !currentTranscript ? (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-gray-400 text-center">
                                        Tap the orb below to start speaking...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, index) => (
                                        <ChatMessage
                                            key={index}
                                            message={msg.message}
                                            type={msg.type}
                                            timestamp={msg.timestamp}
                                        />
                                    ))}

                                    {currentTranscript && (
                                        <div className="flex justify-end animate-fadeIn">
                                            <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-purple-600/60 text-white rounded-tr-sm border border-purple-400/50 backdrop-blur-sm shadow-lg">
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                    {currentTranscript}
                                                </p>
                                                <span className="text-xs opacity-70 mt-2 flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                    Listening...
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ✅ Orb Section - Fills Remaining Space, Min Height 35vh */}
                <div 
                    className="w-full px-8 flex items-center justify-center transition-all duration-700 ease-in-out"
                    style={{
                        flexGrow: 1,
                        flexShrink: 0,
                        minHeight: '35vh',
                    }}
                >
                    <div className="w-full max-w-[1600px]">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16 items-center">
                            {/* Left Column - Email Feature Card */}
                            <div
                                className={`transition-all duration-700 ease-in-out ${
                                    !showChat
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 -translate-x-8 pointer-events-none'
                                }`}
                            >
                                <FeatureCard
                                    icon={
                                        <div className="w-fit h-fit bg-gray-800 flex items-center justify-center">
                                            <img src="/gmail.png" alt="Gmail" className="w-13 h-10" />
                                        </div>
                                    }
                                    title="Email Assistant"
                                    description="Send emails effortlessly with voice commands. Just specify the recipient, subject, and message, and let the assistant handle the rest."
                                />
                            </div>

                            {/* Center Column - Voice Orb */}
                            <div className="flex flex-col items-center justify-center gap-6">
                                {/* Top Heading */}
                                <div
                                    className={`transition-all duration-700 ease-in-out ${
                                        !showChat
                                            ? 'opacity-100 scale-100'
                                            : 'opacity-0 scale-95 h-0 overflow-hidden'
                                    }`}
                                >
                                    <h2
                                        className="text-6xl lg:text-5xl font-bold text-center tracking-wide leading-snug whitespace-nowrap"
                                        style={{
                                            background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #b0b0b0 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            textShadow: '0 0 30px rgba(200, 200, 255, 0.2), 0 0 15px rgba(200, 200, 255, 0.15)',
                                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.1))'
                                        }}
                                    >
                                        Your
                                        <br />
                                        Personal
                                        <br />
                                        voice agent
                                    </h2>
                                </div>

                                {/* Orb + Icon */}
                                <div className="flex flex-col items-center">
                                    <VoiceOrb
                                        isListening={isListening}
                                        onClick={handleOrbClick}
                                        isProcessing={isProcessing || isPlaying}
                                    />

                                    {/* Status Icon */}
                                    <div className="mt-6 h-16 w-16 flex items-center justify-center">
                                        {isProcessing && (
                                            <div className="animate-spin text-5xl">⏳</div>
                                        )}

                                        {isPlaying && (
                                            <div className="animate-pulse">
                                                <svg className="w-12 h-12 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                                </svg>
                                            </div>
                                        )}

                                        {isListening && !isProcessing && !isPlaying && (
                                            <div className="relative">
                                                <svg className="w-12 h-12 text-purple-400 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17 20c-.29 0-.56-.06-.76-.15-.71-.37-1.21-.88-1.71-2.38-.51-1.56-1.47-2.29-2.39-3-.79-.61-1.61-1.24-2.32-2.53C9.29 10.98 9 9.93 9 9c0-2.8 2.2-5 5-5s5 2.2 5 5h2c0-3.93-3.07-7-7-7S7 5.07 7 9c0 1.26.38 2.65 1.07 3.9.91 1.65 1.98 2.48 2.85 3.15.81.62 1.39 1.07 1.71 2.05.6 1.82 1.37 2.84 2.73 3.55.51.23 1.07.35 1.64.35 2.21 0 4-1.79 4-4h-2c0 1.1-.9 2-2 2zM7.64 2.64L6.22 1.22C4.23 3.21 3 5.96 3 9s1.23 5.79 3.22 7.78l1.41-1.41C6.01 13.74 5 11.49 5 9s1.01-4.74 2.64-6.36zM11.5 9c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5z" />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 border-2 border-purple-400 rounded-full animate-ping opacity-75"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* "Ask anything" Text */}
                                <div
                                    className={`transition-all duration-700 ease-in-out ${
                                        !showChat
                                            ? 'opacity-100 scale-100'
                                            : 'opacity-0 scale-95 h-0 overflow-hidden'
                                    }`}
                                >
                                    <h1
                                        className="text-7xl lg:text-6xl font-bold text-center tracking-tight leading-tight"
                                        style={{
                                            background: 'linear-gradient(135deg, #ffffff 0%, #e8e8e8 40%, #c0c0c0 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            textShadow: '0 0 35px rgba(220, 220, 255, 0.25), 0 0 20px rgba(220, 220, 255, 0.15)',
                                            filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.12))',
                                            fontWeight: '800',
                                            letterSpacing: '-0.02em'
                                        }}
                                    >
                                        Ask
                                    </h1>
                                    <h1
                                        className="text-7xl lg:text-6xl font-bold text-center tracking-tight leading-tight"
                                        style={{
                                            background: 'linear-gradient(135deg, #ffffff 0%, #e8e8e8 40%, #c0c0c0 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            textShadow: '0 0 35px rgba(220, 220, 255, 0.25), 0 0 20px rgba(220, 220, 255, 0.15)',
                                            filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.12))',
                                            fontWeight: '800',
                                            letterSpacing: '-0.02em'
                                        }}
                                    >
                                        anything
                                    </h1>
                                </div>
                            </div>

                            {/* Right Column - Two Stacked Feature Cards */}
                            <div
                                className={`flex flex-col gap-20 transition-all duration-700 ease-in-out ${
                                    !showChat
                                        ? 'opacity-100 translate-x-0'
                                        : 'opacity-0 translate-x-8 pointer-events-none'
                                }`}
                            >
                                <FeatureCard
                                    icon={
                                        <div className="w-fit h-fit bg-gray-800 rounded-lg flex items-center justify-center">
                                            <img src="/Perplexity.jpg" alt="Perplexity" className="w-12 h-12" />
                                        </div>
                                    }
                                    title="Research & Insights"
                                    description="Get real-time information and conduct deep research on any topic. Powered by advanced AI to deliver accurate, up-to-date answers instantly."
                                />

                                <FeatureCard
                                    icon={
                                        <div className="w-fit h-fit flex items-center gap-2">
                                            <img src="/n8n.png" alt="n8n" className="w-14 h-8" />
                                            <span className="text-3xl">🌐</span>
                                        </div>
                                    }
                                    title="Multilingual Support"
                                    description="Speak naturally in any language. Built with n8n workflows, this agent understands and responds in multiple languages seamlessly."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceAgent;
