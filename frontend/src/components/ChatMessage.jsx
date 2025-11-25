const ChatMessage = ({ message, type, timestamp }) => {
    const isUser = type === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slideIn`}>
            <div
                className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-lg ${isUser
                        ? 'bg-linear-to-br from-purple-600 to-purple-700 text-white rounded-tr-md'
                        : 'bg-linear-to-br from-gray-700 to-gray-800 text-gray-100 rounded-tl-md border border-gray-600/50'
                    }`}
            >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
                <span className={`text-xs mt-2 block ${isUser ? 'opacity-80' : 'opacity-60'}`}>
                    {timestamp}
                </span>
            </div>
        </div>
    );
};

export default ChatMessage;
