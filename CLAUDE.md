# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs on port 8080)
- **Build production**: `npm run build`
- **Build development**: `npm run build:dev`
- **Linting**: `npm run lint` 
- **Preview build**: `npm run preview`

## Project Architecture

This is a React + TypeScript educational platform with role-based authentication built on Vite. The application serves three main user roles: students, teachers, and administrators.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query + Context API
- **Routing**: React Router v6 with role-based route protection
- **HTTP Client**: Axios with interceptors
- **Internationalization**: react-i18next
- **Theme**: next-themes for dark/light mode
- **Forms**: react-hook-form with Zod validation

### Core Directory Structure
```
src/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui components
│   └── Layout.tsx    # Main app layout wrapper
├── contexts/         # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   └── ThemeContext.tsx   # Theme management
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
│   ├── axios.ts     # Axios instance configuration
│   ├── queryClient.ts    # TanStack Query client
│   └── utils.ts     # General utilities
├── pages/           # Route components (40+ pages)
├── services/        # API service layers
│   ├── api.ts       # Base API configuration
│   ├── authService.ts    # Authentication services
│   └── ragService.ts     # RAG/AI services
├── types/           # TypeScript type definitions
├── utils/           # Helper utilities
└── locales/         # i18n translation files
```

### Authentication System
- Role-based access control (student/teacher/admin)
- JWT token authentication with localStorage persistence
- Automatic token refresh and logout on 401 responses
- Protected route wrapper component with role validation
- API base URL: configurable via `VITE_API_BASE_URL` (defaults to https://api.stementorat.com)

### Key Features by Role
- **Students**: Dashboard, assignments, quizzes, exams, lab reports, AI study tools, flashcards, progress tracking
- **Teachers**: Content creation, lesson planning, grading, analytics, question generation, quiz/exam creation
- **Admins**: User management, system analytics, AI model configuration, platform settings

### Styling Conventions
- Uses shadcn/ui component library with Tailwind CSS
- Custom academic color palette defined in tailwind config
- CSS variables for theming support
- Component styling follows shadcn/ui patterns

### API Integration
- Base API service in `src/services/api.ts` with request/response interceptors
- Service layer pattern for different feature domains (auth, RAG, etc.)
- Error handling includes automatic logout on authentication failures