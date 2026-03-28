# Vesta Brand Guidelines

## Brand Overview

Vesta is an AI-powered financial intelligence platform that transforms complex financial data into clear, actionable insights. Our brand reflects **trust, sophistication, and accessibility** — making CFO-level financial analysis available to every business owner.

### Brand Personality
- **Professional yet Approachable**: Enterprise-grade insights without enterprise complexity
- **Data-Driven**: Powered by AI, grounded in real financial intelligence
- **Empowering**: Democratizing financial expertise for founders and business owners
- **Modern**: Cutting-edge technology with timeless design principles

---

## 1. Color System

### Primary Palette

Our color system is built on a **medium-dark financial theme** that balances professionalism with approachability.

#### Primary (Blue)
- **Value**: `hsl(221, 70%, 58%)`
- **Usage**: Primary CTAs, key actions, brand presence
- **Hover State**: `hsl(221, 70%, 53%)`
- **Foreground**: `hsl(220, 25%, 12%)`
- **Psychology**: Trust, intelligence, stability — the foundation of financial services

#### Accent (Cyan)
- **Value**: `hsl(199, 75%, 52%)`
- **Usage**: Secondary actions, highlights, data visualizations
- **Foreground**: `hsl(220, 25%, 12%)`
- **Psychology**: Clarity, innovation, forward-thinking

#### Background System
- **Primary Background**: `hsl(220, 25%, 12%)` — Deep, professional base
- **Card Background**: `hsl(220, 23%, 15%)` — Elevated surfaces
- **Secondary Surface**: `hsl(220, 20%, 20%)` — Subtle depth

#### Text Hierarchy
- **Primary Text**: `hsl(220, 15%, 88%)` — High contrast, readable
- **Muted Text**: `hsl(220, 10%, 68%)` — Supporting information
- **Primary Foreground**: For use on colored backgrounds

### Financial Data Colors

Purpose-built semantic colors for financial metrics:

```css
--revenue: hsl(142, 65%, 42%)    /* Green - Growth, positive */
--expense: hsl(0, 75%, 65%)      /* Red - Costs, attention */
--profit: hsl(199, 75%, 52%)     /* Cyan - Achievement, balance */
--cash-flow: hsl(221, 70%, 58%)  /* Blue - Liquidity, stability */
```

**Usage Rules**:
- Revenue/Income: Always use `--revenue` green
- Expenses/Costs: Always use `--expense` red
- Profit/Net Income: Always use `--profit` cyan
- Cash Flow: Always use `--cash-flow` blue

### Gradients

#### Hero Gradient
```css
--gradient-hero: linear-gradient(135deg, 
  hsl(221 70% 58%) 0%,    /* Primary Blue */
  hsl(262 75% 62%) 50%,   /* Purple midpoint */
  hsl(199 75% 52%) 100%   /* Accent Cyan */
);
```
**Usage**: Hero sections, major CTAs, brand presence

#### Primary Gradient
```css
--gradient-primary: linear-gradient(135deg, 
  hsl(221 70% 58%),       /* Primary Blue */
  hsl(262 75% 62%)        /* Purple */
);
```
**Usage**: Cards, buttons, decorative elements

#### Success Gradient
```css
--gradient-success: linear-gradient(135deg,
  hsl(142 65% 42%),       /* Green */
  hsl(199 75% 52%)        /* Cyan */
);
```
**Usage**: Success states, positive metrics, achievements

### Shadows & Depth

Our shadow system creates subtle depth without overwhelming the design:

```css
--shadow-card: 0 6px 24px -4px hsl(221 70% 58% / 0.15);
--shadow-glow: 0 0 30px hsl(221 70% 58% / 0.25);
```

**Application**:
- Cards: Use `--shadow-card` for subtle elevation
- Interactive elements on hover: Add `--shadow-glow` for emphasis
- CTAs: Combine both for maximum impact

---

## 2. Typography

### Font System

#### Primary: Neue Montreal (Vesta Brand Font)
```css
font-family: 'Neue Montreal', system-ui, sans-serif;
```
- **Usage**: Brand elements, hero headings, key messaging
- **Characteristics**: Modern, clean, professional
- **Weight Range**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

#### Secondary: Inter (UI Font)
```css
font-family: 'Inter', system-ui, sans-serif;
```
- **Usage**: Body text, UI components, data displays
- **Characteristics**: Highly readable, optimized for screens
- **Weight Range**: 300-700

#### Accent: Kollektif
```css
font-family: 'Kollektif', sans-serif;
```
- **Usage**: Special headers, feature callouts
- **Characteristics**: Distinctive, geometric

### Typography Scale

#### Consumer Pages (Marketing)
```css
/* Hero Headline */
font-size: 3rem;          /* 48px base */
@screen sm: 4rem;         /* 64px */
@screen md: 5rem;         /* 80px */
@screen lg: 7rem;         /* 112px */
font-weight: 700;
line-height: 1.1;
tracking: -0.02em;

/* Section Headers */
font-size: 2.5rem;        /* 40px */
font-weight: 600;
line-height: 1.2;

/* Body Large */
font-size: 1.125rem;      /* 18px */
line-height: 1.6;
```

#### Product Pages (Dashboard/Chat)
```css
/* Page Title */
font-size: 2rem;          /* 32px */
font-weight: 600;
line-height: 1.3;

/* Card Title */
font-size: 1.25rem;       /* 20px */
font-weight: 600;
line-height: 1.4;

/* Body Text */
font-size: 0.875rem;      /* 14px */
line-height: 1.5;

/* Small/Meta */
font-size: 0.75rem;       /* 12px */
line-height: 1.4;
```

---

## 3. Component Guidelines

### Buttons

#### Hero Variant (Primary CTA)
```tsx
<Button variant="hero" size="xl">
  Get Started Free
</Button>
```
- **Style**: Bold gradient background, white text, prominent shadow
- **Usage**: Primary conversion actions on marketing pages
- **Hover**: Subtle scale (1.05), increased shadow
- **Padding**: `px-8 py-4` (lg: `px-10 py-5`)

#### Standard Primary
```tsx
<Button variant="default">
  Continue
</Button>
```
- **Style**: Solid primary blue, dark text
- **Usage**: Primary actions in product
- **States**: Clear hover, active, disabled states

#### Outline
```tsx
<Button variant="outline">
  Learn More
</Button>
```
- **Style**: Border with transparent background
- **Usage**: Secondary actions, less emphasis
- **Hover**: Subtle background fill

### Cards

#### Marketing Cards (Consumer Pages)
```tsx
<Card className="hover:shadow-lg transition-all duration-300">
  <CardHeader>
    <CardTitle>Feature Name</CardTitle>
    <CardDescription>Brief description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```
- **Background**: White or light card surface
- **Shadow**: Subtle → Prominent on hover
- **Transition**: Smooth 300ms
- **Border**: Light, subtle

#### Product Cards (Dashboard)
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="w-5 h-5" />
      Metric Name
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Data visualization or content */}
  </CardContent>
</Card>
```
- **Background**: Card surface (`--card`)
- **Shadow**: Card shadow (`--shadow-card`)
- **Padding**: Consistent spacing
- **Icons**: 20px (w-5 h-5), matching brand color

### Badges

```tsx
{/* Status Indicators */}
<Badge variant="success">Active</Badge>
<Badge variant="default">Premium</Badge>
<Badge variant="outline">Free</Badge>
```

**Color Mapping**:
- Success/Positive: Green
- Default/Info: Blue
- Warning: Amber
- Destructive/Alert: Red

---

## 4. Consumer-Facing Pages (Pricing Focus)

### Layout Structure

#### Pricing Page Anatomy
```
1. Navigation Bar
   - Logo (left)
   - Menu items (center)
   - CTA button (right)
   - Background: White with subtle border

2. Hero Section
   - Headline with gradient
   - Value proposition
   - Toggle: Monthly/Annual billing
   - Trust indicators

3. Pricing Cards Grid
   - 3-column layout (desktop)
   - 1-column stack (mobile)
   - Featured plan highlighted

4. FAQ Section
   - Accordion-style
   - Common questions
   - Clear, concise answers

5. Footer
   - Comprehensive link structure
   - 5-column grid
   - Muted styling
```

### Pricing Card Design

#### Visual Hierarchy
```tsx
<Card className={isPopular ? "border-primary shadow-glow" : ""}>
  {isPopular && (
    <Badge className="absolute -top-3">Most Popular</Badge>
  )}
  
  <CardHeader>
    <div className="flex items-center gap-2">
      <Icon className="w-6 h-6 text-primary" />
      <CardTitle className="text-2xl">Plan Name</CardTitle>
    </div>
    
    <div className="flex items-baseline gap-2 mt-4">
      <span className="text-5xl font-bold">${price}</span>
      <span className="text-muted-foreground">/month</span>
    </div>
    
    <CardDescription className="mt-2">
      Brief description of the plan
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <ul className="space-y-3">
      {features.map(feature => (
        <li className="flex items-center gap-2">
          <Check className="w-5 h-5 text-success" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    
    <Button variant={isPopular ? "hero" : "outline"} className="w-full mt-6">
      Get Started
    </Button>
  </CardContent>
</Card>
```

#### Pricing Card States

**Free/Founder Plan**:
- Border: Subtle gray
- CTA: Outline variant
- Emphasis: "Get Started Free"

**Scale Plan (Popular)**:
- Border: Primary blue, glowing
- Badge: "Most Popular" at top
- CTA: Hero variant gradient
- Shadow: Enhanced glow effect

**CEO Plan (Premium)**:
- Border: Accent cyan
- Visual accent: Gradient border
- CTA: Primary blue solid
- Badge: "Best Value" or "Premium"

### Pricing Page Copy Guidelines

**Headlines**:
- Direct, value-focused
- Example: "Plans that grow with your business"
- Font: Neue Montreal Bold, 40-48px

**Subheadlines**:
- Clarify offering
- Example: "Start free, upgrade when ready. No credit card required."
- Font: Inter Regular, 18-20px, muted color

**Feature Lists**:
- Benefit-oriented (not just feature names)
- Use checkmarks (success green)
- Short, scannable format
- Group related features

**CTAs**:
- Action-oriented language
- "Get Started Free" > "Sign Up"
- "Upgrade to Scale" > "Buy Now"

---

## 5. Product Pages (Chat/Dashboard)

### Dashboard Philosophy

The dashboard is **data-dense but not overwhelming**. We achieve this through:
1. Clear visual hierarchy
2. Consistent card system
3. Semantic color usage
4. Progressive disclosure

### Dashboard Layout

```
┌─────────────────────────────────────────┐
│  Top Bar (User, Settings, Notifications)│
├─────────────────────────────────────────┤
│                                          │
│  Tab Navigation                          │
│  [Overview] [Data] [Insights] [Credits] │
│                                          │
├─────────────────────────────────────────┤
│                                          │
│  Content Area (Cards Grid)               │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ Metric │ │ Metric │ │ Metric │      │
│  └────────┘ └────────┘ └────────┘      │
│  ┌───────────────────┐ ┌────────┐      │
│  │  Chart/Visual     │ │ Alerts │      │
│  └───────────────────┘ └────────┘      │
│                                          │
└─────────────────────────────────────────┘
```

### Metric Cards

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-sm font-medium">
      Revenue
    </CardTitle>
    <DollarSign className="w-4 h-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      <CountUpAnimation
        end={value}
        duration={2000}
        prefix="$"
      />
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      <span className="text-success">+12.5%</span> from last month
    </p>
  </CardContent>
</Card>
```

**Design Principles**:
- Icons: 16px (w-4 h-4), muted color
- Title: Small (14px), medium weight
- Value: Large (24-32px), bold
- Change indicator: Small (12px), semantic color
- Animation: Smooth count-up on load/update

### Chat Interface

#### Chat Hub Design
```tsx
<div className="flex h-screen bg-background">
  {/* Sidebar - Conversations */}
  <aside className="w-64 border-r">
    {/* Conversation list */}
  </aside>
  
  {/* Main Chat Area */}
  <main className="flex-1 flex flex-col">
    {/* Header */}
    <header className="border-b p-4">
      {/* Title, actions */}
    </header>
    
    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Message bubbles */}
    </div>
    
    {/* Input */}
    <div className="border-t p-4">
      {/* Message input with suggestions */}
    </div>
  </main>
</div>
```

#### Message Styling

**User Messages**:
```tsx
<div className="flex justify-end">
  <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[80%]">
    {message}
  </div>
</div>
```

**AI Messages**:
```tsx
<div className="flex justify-start gap-3">
  <Avatar className="w-8 h-8">
    <Sparkles className="w-4 h-4" />
  </Avatar>
  <div className="bg-card rounded-2xl px-4 py-3 max-w-[80%] shadow-sm">
    {message}
  </div>
</div>
```

**Design Details**:
- Rounded corners: 16px (rounded-2xl)
- User messages: Right-aligned, primary color
- AI messages: Left-aligned, card color, with AI avatar
- Max width: 80% to maintain readability
- Spacing: 16px between messages

#### Chat Input
```tsx
<div className="relative">
  <Textarea
    placeholder="Ask about your financials..."
    className="pr-12 min-h-[60px] resize-none"
  />
  <Button
    size="icon"
    className="absolute right-2 bottom-2"
  >
    <Send className="w-4 h-4" />
  </Button>
</div>
```

**Features**:
- Auto-resize textarea
- Send button positioned inside
- @ mentions support with dropdown
- File attachment option
- Clear visual hierarchy

---

## 6. Hero Section Guidelines

### Hero Anatomy

The hero section is the **first impression** and must immediately communicate value.

#### Structure
```tsx
<section className="relative overflow-hidden bg-background min-h-screen flex items-center">
  {/* Background Effects (optional gradient/blur) */}
  
  <div className="container px-4 mx-auto max-w-screen-xl">
    <div className="text-center max-w-4xl mx-auto">
      
      {/* Main Headline */}
      <h1 className="text-7xl font-bold">
        Understand Your Business Like a{' '}
        <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
          CFO
        </span>
        . Instantly.
      </h1>
      
      {/* Value Proposition */}
      <p className="text-xl text-muted-foreground mt-6 max-w-3xl mx-auto">
        AI-powered insights from your financial data — no spreadsheets, 
        no confusion. Get plain-language explanations and strategic 
        recommendations to grow your business.
      </p>
      
      {/* CTA Buttons */}
      <div className="flex gap-4 justify-center mt-10">
        <Button variant="hero" size="xl">
          Get Started Free
        </Button>
        <Button variant="outline" size="xl">
          <Play className="w-5 h-5 mr-2" />
          Watch How It Works
        </Button>
      </div>
      
      {/* Social Proof */}
      <div className="mt-12">
        <p className="text-sm text-muted-foreground mb-6">
          Product developed with insights from career professionals from
        </p>
        <div className="flex justify-center items-center gap-8 opacity-60">
          {/* Company logos - grayscale */}
        </div>
      </div>
    </div>
  </div>
</section>
```

### Hero Typography

**Headline**:
- Font: Neue Montreal Bold
- Size: 112px desktop (7rem), 48px mobile (3rem)
- Line height: 1.1 (tight for impact)
- Letter spacing: -0.02em (slight tighten)

**Gradient Text**:
- Apply `bg-gradient-to-r from-blue-300 to-blue-500`
- Use `bg-clip-text text-transparent`
- Highlights the key value proposition word

**Subheadline**:
- Font: Inter Regular
- Size: 20px (1.25rem)
- Color: Muted foreground
- Line height: 1.6 (comfortable reading)
- Max width: 48rem (768px)

### Hero CTAs

**Primary CTA**:
- Variant: `hero`
- Size: `xl`
- Text: Action-oriented ("Get Started Free")
- Position: Left (primary position)
- Hover: Scale to 1.05, increase shadow

**Secondary CTA**:
- Variant: `outline`
- Size: `xl`
- Text: Low-pressure exploration ("Watch How It Works")
- Position: Right
- Icon: Play icon (w-5 h-5)

### Hero Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}
```

**Stagger Pattern**:
- Headline: 0.2s delay
- Subheadline: 0.4s delay
- CTAs: 0.6s delay
- Social proof: 0.8s delay

---

## 7. Interaction & Motion

### Transition Standards

```css
/* Standard transitions */
--transition-smooth: all 0.2s ease-in-out;
--transition-all: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

**Usage**:
- Buttons: 200ms ease-in-out
- Cards: 300ms cubic-bezier
- Page transitions: 400ms ease
- Modals/Overlays: 200ms ease-out

### Hover States

**Cards**:
```css
hover:shadow-lg hover:scale-[1.02] transition-all duration-300
```

**Buttons**:
```css
hover:scale-105 hover:shadow-glow transition-all duration-300
```

**Links**:
```css
hover:text-primary transition-colors duration-200
```

### Micro-interactions

**Count-Up Animations** (Financial metrics):
- Duration: 2000ms
- Easing: ease-out
- Trigger: On mount and data update
- Format: Locale-aware number formatting

**Loading States**:
- Skeleton screens for content loading
- Spinner with primary color for actions
- Progress bars for multi-step processes

---

## 8. Responsive Design

### Breakpoint System

```typescript
screens: {
  sm: '640px',   // Mobile landscape, tablet portrait
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1400px' // Extra large
}
```

### Mobile-First Approach

Always design and implement mobile-first, then enhance for larger screens.

**Example**:
```tsx
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl">
  Headline
</h1>
```

### Layout Shifts

**Marketing Pages**:
- 3-column → 1-column stack
- Side-by-side → Stacked sections
- Horizontal nav → Hamburger menu

**Product Pages**:
- Dashboard cards: 3-col → 2-col → 1-col
- Sidebar: Full width → Collapsed → Hidden (mobile)
- Chat: Single column with toggleable sidebar

---

## 9. Accessibility

### Color Contrast

All text must meet **WCAG AA standards** (4.5:1 for normal text, 3:1 for large text).

**Tested Combinations**:
- Primary on background: ✅ 7.2:1
- Foreground on background: ✅ 9.1:1
- Muted on background: ✅ 4.8:1

### Interactive Elements

- Minimum touch target: 44x44px
- Clear focus indicators (ring with primary color)
- Keyboard navigation support
- Screen reader labels on icons

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Voice & Tone

### Marketing Copy

**Hero Headlines**:
- Bold, aspirational
- Focus on transformation
- Example: "Understand Your Business Like a CFO. Instantly."

**Feature Descriptions**:
- Benefit-first, not feature-first
- Clear, jargon-free language
- Example: "See exactly where your money goes" vs "Advanced expense categorization"

**CTAs**:
- Action-oriented verbs
- Remove friction
- Example: "Get Started Free" > "Sign Up"

### Product Copy

**Dashboard Messages**:
- Professional but friendly
- Data-driven but human
- Example: "Your revenue is up 12.5% this month. Great work!"

**Error Messages**:
- Helpful, not technical
- Guide to solution
- Example: "We couldn't sync your data. Check your internet connection and try again."

**Empty States**:
- Encouraging, not blank
- Clear next action
- Example: "No data yet? Upload your first document to get started."

---

## 11. Icon Usage

### Icon Library
Primary: Lucide React (`lucide-react`)

### Icon Sizing

```tsx
// Small (UI elements)
<Icon className="w-4 h-4" />  // 16px

// Medium (Cards, features)
<Icon className="w-5 h-5" />  // 20px

// Large (Headers)
<Icon className="w-6 h-6" />  // 24px

// Extra Large (Hero elements)
<Icon className="w-8 h-8" />  // 32px
```

### Icon Colors

```tsx
// Muted (default)
<Icon className="text-muted-foreground" />

// Primary (active, important)
<Icon className="text-primary" />

// Semantic (financial metrics)
<TrendingUp className="text-success" />  // Revenue up
<TrendingDown className="text-destructive" />  // Metrics down
```

### Icon Pairing

Always pair icons with text for clarity. Icons alone should only be used when:
1. Space is extremely limited (mobile nav)
2. Icon meaning is universal (×, ☰)
3. Tooltip is provided on hover

---

## 12. Content Patterns

### Loading States

```tsx
// Skeleton for cards
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-1/3" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-8 w-1/2 mb-2" />
    <Skeleton className="h-3 w-2/3" />
  </CardContent>
</Card>

// Full page loading
<div className="flex items-center justify-center min-h-screen">
  <Loader2 className="w-8 h-8 animate-spin text-primary" />
</div>
```

### Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
    <FileText className="w-8 h-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
  <p className="text-muted-foreground mb-6 max-w-sm">
    Upload your first financial document to start getting AI-powered insights.
  </p>
  <Button>
    <Upload className="w-4 h-4 mr-2" />
    Upload Document
  </Button>
</div>
```

### Error States

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error syncing data</AlertTitle>
  <AlertDescription>
    We couldn't connect to your accounting software. 
    Please check your connection and try again.
  </AlertDescription>
</Alert>
```

---

## Implementation Checklist

### Consumer Page (Pricing) ✓
- [ ] Hero section with gradient headline
- [ ] 3-tier pricing cards
- [ ] Annual/Monthly toggle
- [ ] Featured plan highlighted
- [ ] Check icons for features (success green)
- [ ] Hero variant CTA on popular plan
- [ ] FAQ accordion section
- [ ] Footer with 5-column grid
- [ ] Mobile-responsive layout
- [ ] Smooth animations on scroll

### Product Page (Dashboard) ✓
- [ ] Tab navigation system
- [ ] Metric cards with count-up animations
- [ ] Consistent card shadows
- [ ] Semantic colors for financial data
- [ ] Icon + title pattern in headers
- [ ] Loading skeletons
- [ ] Empty states with CTAs
- [ ] Settings modal
- [ ] Notification center
- [ ] Credit tracker

### Product Page (Chat) ✓
- [ ] Sidebar conversation list
- [ ] Message bubbles (user vs AI)
- [ ] AI avatar/icon
- [ ] Auto-resizing textarea
- [ ] @ mention support
- [ ] File attachment
- [ ] Smooth scroll to bottom
- [ ] Typing indicators
- [ ] Message timestamps
- [ ] New conversation button

---

## Quick Reference

### Most Used Classes

```tsx
// Containers
"container mx-auto px-4 max-w-screen-xl"

// Cards
"hover:shadow-lg transition-all duration-300"

// Buttons (Hero CTA)
"bg-gradient-to-r from-primary to-accent text-primary-foreground hover:scale-105 transition-all"

// Text Gradients
"bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent"

// Spacing
"space-y-6"  // Vertical
"gap-4"      // Grid/Flex

// Animations
"animate-fade-in"
```

### Color Variable Reference

```css
/* Text */
text-foreground
text-muted-foreground
text-primary
text-success
text-destructive

/* Backgrounds */
bg-background
bg-card
bg-primary
bg-accent

/* Borders */
border-border
border-primary
```

---

## Brand Don'ts

❌ **Never**:
- Use pure black (#000000) or pure white (#FFFFFF)
- Mix custom colors with semantic tokens
- Apply multiple gradients on the same element
- Use more than 2 font families on a page
- Disable animations without checking motion preferences
- Use lorem ipsum in production
- Create custom components when existing ones suffice

✅ **Always**:
- Use design tokens from index.css
- Test on mobile devices
- Maintain consistent spacing
- Follow semantic color meanings
- Provide loading and error states
- Include hover states on interactive elements

---

## Updates & Maintenance

This document reflects the current design system as of **November 2024**.

**Version**: 1.0  
**Last Updated**: 2024-11-14  
**Next Review**: Q1 2025

For questions or suggestions, contact the design team.

