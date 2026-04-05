import type { Config } from "tailwindcss";

export default {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				lg: '2rem',
				xl: '2.5rem',
				'2xl': '3rem'
			},
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1536px'
			}
		},
		extend: {
		fontFamily: {
			'sans': ['DM Sans', 'system-ui', 'sans-serif'],
			'display': ['Cormorant Garamond', 'Georgia', 'serif'],
			'mono': ['DM Mono', 'monospace'],
			'serif': ['Cormorant Garamond', 'Georgia', 'serif'],
			/** Google Stitch “Vesta Onyx” / Financial Architect pairing */
			'stitch': ['Manrope', 'system-ui', 'sans-serif'],
			'stitch-body': ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
		},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				// Financial specific colors
				revenue: 'hsl(var(--revenue))',
				expense: 'hsl(var(--expense))',
				profit: 'hsl(var(--profit))',
				'cash-flow': 'hsl(var(--cash-flow))',
				/* Vesta CFO marketing kit — see BRAND_KIT.md */
				vesta: {
					navy: '#1B3A5C',
					'navy-muted': '#2E6DA4',
					gold: '#C8963E',
					cream: '#F7F4EE',
					mist: '#D6E8F2',
				},
				/** Partner OAuth / accounting CTAs — hex only in theme, not in className strings */
				integrate: {
					quickbooks: {
						DEFAULT: '#2CA01C',
						hover: '#228516',
					},
					xero: {
						DEFAULT: '#13B5EA',
						hover: '#0F9BC7',
					},
					wave: {
						DEFAULT: '#266FE8',
						hover: '#1E5BC0',
					},
					zoho: {
						from: '#1F4E79',
						to: '#4A90E2',
						'from-hover': '#1A4268',
						'to-hover': '#3A7BC8',
					},
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
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
				},
				'fadeInChar': {
					'0%': {
						opacity: '0',
						transform: 'translateY(1px) scale(0.98)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)'
					}
				},
				'slideInChar': {
					'0%': {
						opacity: '0',
						transform: 'translateY(8px) scale(0.9)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)'
					}
				},
			'blob': {
					'0%': {
						transform: 'translate(0px, 0px) scale(1)'
					},
					'33%': {
						transform: 'translate(30px, -50px) scale(1.1)'
					},
					'66%': {
						transform: 'translate(-20px, 20px) scale(0.9)'
					},
					'100%': {
						transform: 'translate(0px, 0px) scale(1)'
					}
				},
				'wordReveal': {
					'0%': {
						opacity: '0',
						transform: 'translateY(12px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fadeSlideUp': {
					'0%': {
						opacity: '0',
						transform: 'translateY(16px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'riseUp': {
					'0%': {
						opacity: '0',
						transform: 'translateY(40px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
			'scaleIn': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
			'fadeIn': {
				'0%': {
					opacity: '0'
				},
				'100%': {
					opacity: '1'
				}
			},
			'slideInLeft': {
				'0%': {
					opacity: '0',
					transform: 'translateX(-30px)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateX(0)'
				}
			},
			'slideInRight': {
				'0%': {
					opacity: '0',
					transform: 'translateX(30px)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateX(0)'
				}
			},
			'floatUp': {
				'0%': {
					opacity: '0',
					transform: 'translateY(60px) scale(0.95)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateY(0) scale(1)'
				}
			},
			'cardReveal': {
				'0%': {
					opacity: '0',
					transform: 'translateY(30px) rotateX(10deg)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateY(0) rotateX(0deg)'
				}
			}
		},
		animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fadeInChar': 'fadeInChar 0.1s ease-out forwards',
				'blob': 'blob 7s infinite',
				'wordReveal': 'wordReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'fadeSlideUp': 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'riseUp': 'riseUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'scaleIn': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'fadeIn': 'fadeIn 0.5s ease-out forwards',
				'slideInLeft': 'slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'slideInRight': 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'floatUp': 'floatUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'cardReveal': 'cardReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }: any) {
			addUtilities({
				'.scrollbar-hide': {
					'-ms-overflow-style': 'none',
					'scrollbar-width': 'none',
					'&::-webkit-scrollbar': {
						display: 'none'
					}
				},
				'.animation-delay-2000': {
					'animation-delay': '2s'
				},
				'.animation-delay-4000': {
					'animation-delay': '4s'
				},
				'.animation-delay-6000': {
					'animation-delay': '6s'
				}
			})
		}
	],
} satisfies Config;
