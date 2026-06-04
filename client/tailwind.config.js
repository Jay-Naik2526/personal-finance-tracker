/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
            },
            colors: {
                // ── Surfaces ──
                bg:       '#F7F7F8',   // main page background
                surface:  '#FFFFFF',   // cards / panels
                raised:   '#F3F4F6',   // slightly elevated bg (hover states, inputs)

                // ── Borders ──
                border:   '#E5E7EB',   // default border
                'border-strong': '#D1D5DB', // stronger divider

                // ── Text ──
                ink:      '#0C0C0E',   // primary text
                sub:      '#6B7280',   // secondary text
                dim:      '#9CA3AF',   // very muted

                // ── Semantic ──
                pos:      '#16A34A',   // income / positive — green-600
                neg:      '#DC2626',   // expense / negative — red-600
                warn:     '#D97706',   // warning — amber-600
                cta:      '#0C0C0E',   // primary CTA — near black

                // ── iOS-style card tints ──
                'tint-red':    '#FEF2F2',
                'tint-green':  '#F0FDF4',
                'tint-blue':   '#EFF6FF',
                'tint-purple': '#FAF5FF',
                'tint-amber':  '#FFFBEB',
                'tint-zinc':   '#FAFAFA',

                // ── Legacy aliases (keep existing components working) ──
                void:          '#F7F7F8',
                panel:         '#FFFFFF',
                card:          '#FFFFFF',
                paper:         '#F7F7F8',
                sheet:         '#FFFFFF',
                parchment:     '#F3F4F6',
                line:          '#E5E7EB',
                rule:          '#E5E7EB',
                bold:          '#0C0C0E',
                primary:       '#0C0C0E',
                secondary:     '#16A34A',
                accent:        '#DC2626',
                text:          '#0C0C0E',
                muted:         '#6B7280',
                background:    '#F7F7F8',
                surfaceHighlight: 'rgba(0,0,0,0.02)',
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '24px',
            },
            boxShadow: {
                'card':    '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)',
                'card-md': '0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
                'card-lg': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)',
                'float':   '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
                'pill':    '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
            },
            animation: {
                'fade-up':   'fadeUp 0.35s ease forwards',
                'fade-in':   'fadeIn 0.2s ease forwards',
                'slide-up':  'slideUp 0.3s cubic-bezier(0.32,0.72,0,1) forwards',
            },
            keyframes: {
                fadeUp:   { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
                fadeIn:   { '0%': { opacity: '0', transform: 'scale(0.98)' },      '100%': { opacity: '1', transform: 'scale(1)' } },
                slideUp:  { '0%': { transform: 'translateY(100%)' },               '100%': { transform: 'translateY(0)' } },
            },
        },
    },
    plugins: [],
}
