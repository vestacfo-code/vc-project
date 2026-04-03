/** Shared spring presets for morph-style page and layout transitions */
export const morphSpring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 36,
  mass: 0.85,
};

export const morphSpringSoft = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

export const pageMorphTransition = {
  ...morphSpring,
  opacity: { duration: 0.22 },
  filter: { duration: 0.28 },
};
