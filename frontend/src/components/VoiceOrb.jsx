import { useState } from 'react';

const VoiceOrb = ({ isListening, onClick, isProcessing }) => (
    <div className="relative flex items-center justify-center">
        {/* Outer animated glow */}
        <div
            className={`absolute w-48 h-48 rounded-full transition-all duration-500
             ${isListening
                    ? 'bg-purple-600/20 animate-pulse'
                    : 'bg-purple-600/10'
                }`}
            style={{ filter: 'blur(30px)' }}
        />

        {/* Animated outline rings */}
        {isListening ? (
            <>
                <div className="absolute w-44 h-44 rounded-full border-2 border-purple-400/50 animate-outline-pulse z-10" />
                <div className="absolute w-36 h-36 rounded-full border border-purple-400/30 animate-outline-pulse z-10" style={{ animationDelay: '0.6s' }} />
                <div className="absolute w-28 h-28 rounded-full border border-purple-400/30 animate-outline-pulse z-10" style={{ animationDelay: '1.2s' }} />
            </>
        ) : (
            <>
                <div className="absolute w-44 h-44 rounded-full border-2 border-purple-500/30 transition-all duration-300" />
                <div className="absolute w-36 h-36 rounded-full border border-purple-500/20 transition-all duration-300" />
                <div className="absolute w-28 h-28 rounded-full border border-purple-500/20 transition-all duration-300" />
            </>
        )}

        {/* Main orb */}
        <button
            onClick={onClick}
            disabled={isProcessing}
            className={`relative w-32 h-32 rounded-full transition-all duration-500 transform 
                    ${isProcessing
                    ? 'opacity-70 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-105'
                }
                `}
            style={{
                background: isListening
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 60%, #f093fb 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 60%, #ffd89b 100%)',
                boxShadow: isListening
                    ? '0 0 40px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(255,255,255, 0.1)'
                    : '0 0 15px rgba(139, 92, 246, 0.4), inset 0 0 10px rgba(255,255,255,0.1)'
            }}
        >
            {/* Inner gradient layer */}
            <div className="absolute inset-2 rounded-full bg-linear-to-br from-white/20 to-transparent" />

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
                {!isListening ? (
                    // Sparkle icon
                    <svg className="w-10 h-10 text-white animate-float" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z" />
                        <path d="M6 2L5 5L2 6L5 7L6 10L7 7L10 6L7 5L6 2Z" />
                        <path d="M18 14L17 17L14 18L17 19L18 22L19 19L22 18L19 17L18 14Z" />
                    </svg>
                ) : (
                    // Microphone icon
                    <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                    </svg>
                )}
            </div>

            {/* Speaking animation waves (keep as is) */}
            {isListening && (
                <>
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                        <div className="w-1 bg-white rounded-full animate-wave" style={{ height: '12px', animationDelay: '0ms' }} />
                        <div className="w-1 bg-white rounded-full animate-wave" style={{ height: '16px', animationDelay: '150ms' }} />
                        <div className="w-1 bg-white rounded-full animate-wave" style={{ height: '14px', animationDelay: '300ms' }} />
                    </div>
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                        <div className="w-1 bg-white rounded-full animate-wave" style={{ height: '14px', animationDelay: '300ms' }} />
                        <div className="w-1 bg-white rounded-full animate-wave" style={{ height: '16px', animationDelay: '150ms' }} />
                        <div className="w-1 bg-white rounded-full animate-wave" style={{ height: '12px', animationDelay: '0ms' }} />
                    </div>
                </>
            )}
        </button>
    </div>
);

export default VoiceOrb;
