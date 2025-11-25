const FeatureCard = ({ icon, title, description }) => {
    return (
        <div className="group relative">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Card */}
            <div className="relative bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 shadow-xl">
                {/* Icon Container */}
                <div className="flex items-center justify-center mb-4">
                    {typeof icon === 'string' ? (
                        // Simple emoji/text icon
                        <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20">
                            <span className="text-3xl">{icon}</span>
                        </div>
                    ) : (
                        // Custom JSX icon (for logos)
                        <div className="flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2 tracking-wide">
                    {title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default FeatureCard;
