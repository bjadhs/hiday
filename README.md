# Hiday (Bruddle)

> **Manage your time, beautifully.**

Hiday is a premium time-tracking application designed for clarity, functional minimalism, and aesthetic excellence. Built with the **Bruddle** neo-brutalist design system, it features high-contrast boundaries, hard shadows, vibrant violet accents, and a warm amber palette that shines in both light and dark modes.

![Hiday Hero Image](/Users/bijayadhs/.gemini/antigravity/brain/5ce07a0f-fa90-45cd-bedc-ba2598248c74/howistheday_hero_image_1771240495218.png)

## ✨ Features

- **🚀 One-Tap Tracking**: Effortless start/stop for your daily tasks.
- **📊 Advanced Analytics**: Insights via pie charts, bar charts, and historical trends.
- **🎯 Goal Management**: Set daily and weekly targets with visual progress tracking.
- **🏷️ Flexible Tagging**: Categorize your time with standard, numeric, and dropdown tags.
- **📱 Multi-Platform Sync**: Seamless experience across iOS, Android, and Web.
- **🌓 Light & Dark Mode**: Premium theme with automatic switching and manual toggle.
- **🎨 Neo-Brutalist Design**: "Bruddle" design system with thick borders, hard shadows, and bold typography.

## 🛠️ Technology Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://reactjs.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom CSS variable architecture
- **Database/Auth**: [Supabase](https://supabase.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand), [React Query](https://tanstack.com/query/latest)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React Icons](https://lucide.dev/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)

## 🎨 Design System

### Bruddle — Neo-Brutalist Aesthetic

- **High-contrast boundaries**: Thick borders (`border-2`, `border-3`) with strong colors
- **Hard shadows**: Offset box shadows (`shadow-brutal`, `shadow-brutal-lg`) with no blur
- **Vibrant accents**: Rich violet (`#6D28D9`) primary with warm amber (`#F59E0B`) highlights
- **Sharp corners**: `rounded-none` for that blocky, industrial feel
- **Press effects**: Buttons that physically depress on click (`btn-brutal`)

### Theme Colors

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Background | `#F8F7F4` | `#0C0C0E` |
| Surface | `#F0EFEA` | `#1A1A1E` |
| Primary | `#6D28D9` (Violet) | `#8B5CF6` |
| Accent | `#F59E0B` (Amber) | `#FBBF24` |
| Text | `#1A1A1E` | `#F2F2F5` |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.9.0
- npm

### Installation

```bash
npm install
```

### Development

```bash
# Start dev server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
myapp/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group (login/signup)
│   ├── track/             # Time tracking page
│   ├── tasks/             # Task management page
│   ├── timeline/          # Timeline view page
│   ├── history/           # History page
│   ├── analyze/           # Analytics page
│   ├── settings/          # Settings page
│   └── todos/             # Todos page
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── auth-card.tsx     # Shared auth form (login/signup)
│   ├── background-pattern.tsx  # Reusable dot/grid pattern
│   ├── navbar.tsx        # Shared navbar with theme toggle
│   └── theme-toggle.tsx  # Light/dark mode switcher
├── lib/                   # Utilities & configurations
│   ├── hooks/            # React Query hooks
│   ├── stores/           # Zustand stores
│   └── supabase/         # Supabase client/config
└── actions/              # Server Actions
```

## 🔑 Key Components

| Component | Description |
|-----------|-------------|
| `<AuthCard mode="signin \| signup">` | Shared authentication form with brutalist styling |
| `<BackgroundPattern variant="dots \| grid">` | Full-page background pattern with frosted-glass content overlay |
| `<Navbar showGetStarted?>` | Sticky navbar with logo, theme toggle, and optional CTA |
| `<ThemeToggle>` | Sun/moon switcher with brutalist pill design |

## 📝 License

© 2026 Hiday. All rights reserved.
