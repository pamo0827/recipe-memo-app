import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: [
  				'var(--font-noto-sans-jp)',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				'50': '#FFF3E0',
  				'100': '#FFE0B2',
  				'200': '#FFCC80',
  				'300': '#FFB74D',
  				'400': '#FFA726',
  				'500': '#FF8A65',
  				'600': '#FF7043',
  				'700': '#FF5722',
  				'800': '#E64A19',
  				'900': '#BF360C',
  				DEFAULT: '#FF8A65',
  				foreground: '#FFFFFF'
  			},
  			secondary: {
  				'50': '#FDF7F0',
  				'100': '#F4E5D3',
  				'200': '#E8D5B7',
  				'300': '#DDB892',
  				'400': '#D2A679',
  				'500': '#C4915C',
  				'600': '#B87333',
  				'700': '#A0522D',
  				'800': '#8B4513',
  				'900': '#654321',
  				DEFAULT: '#F4E5D3',
  				foreground: '#8B4513'
  			},
  			accent: {
  				DEFAULT: '#FFAB91',
  				foreground: '#5D4037'
  			},
  			destructive: {
  				DEFAULT: '#FF6B6B',
  				foreground: '#FFFFFF'
  			},
  			muted: {
  				DEFAULT: '#F5F5DC',
  				foreground: '#8B7355'
  			},
  			popover: {
  				DEFAULT: '#FFFAF0',
  				foreground: '#5D4037'
  			},
  			card: {
  				DEFAULT: '#FFFAF0',
  				foreground: '#5D4037'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
