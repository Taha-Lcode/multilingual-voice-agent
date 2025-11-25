export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'gradient-shift': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                outlinePulse: {
                    '0%': { transform: 'scale(0.7)', opacity: '1' },
                    '60%': { transform: 'scale(1.35)', opacity: '0' },
                    '100%': { transform: 'scale(0.7)', opacity: '0' }
                },
                
            },
            animation: {
                'gradient-shift': 'gradient-shift 10s ease infinite',
                'fadeIn': 'fadeIn 0.3s ease-in',
                'slideIn': 'slideIn 0.4s ease-out',
                'outline-pulse': 'outlinePulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin': 'spin 1s linear infinite',
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
            }
        }
    },
    plugins: [
        require('tailwind-scrollbar'),
    ],
}
