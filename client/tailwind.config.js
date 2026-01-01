/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
            },
            colors: {
                background: '#050511', // Deep space blue/black
                surface: 'rgba(255, 255, 255, 0.05)', // Glassy white
                surfaceHighlight: 'rgba(255, 255, 255, 0.1)',
                primary: '#6366f1', // Indigo 500
                secondary: '#10b981', // Emerald 500
                accent: '#f43f5e', // Rose 500
                text: '#f8fafc', // Slate 50
                muted: '#94a3b8', // Slate 400
                border: 'rgba(255, 255, 255, 0.1)',
            },
            backgroundImage: {
                'gradient-mesh': 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
                'glass': 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
