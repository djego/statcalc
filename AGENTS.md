# Agent Guidelines for Statistical Calculator

## Build/Test/Lint Commands
- `npm dev` - Start development server (Next.js 16)
- `npm build` - Build production bundle
- `npm lint` - Run ESLint on entire codebase (.ts, .tsx, .js, .jsx files)
- No test suite configured

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript 5 (strict mode)
- UI: Radix UI components, Tailwind CSS 4, shadcn/ui patterns
- State: React hooks (no global state library)
- Forms: react-hook-form with zod validation

## Code Style
- **Imports**: Use `@/` alias for all internal imports (e.g., `@/components/ui/button`, `@/lib/statistics`)
- **Components**: Functional components with TypeScript types, use `type` for props interfaces
- **Naming**: camelCase for functions/variables, PascalCase for components, kebab-case for files
- **Files**: Place pages in `app/[name]/page.tsx`, reusable components in `components/`, utilities in `lib/`
- **Error Handling**: Validate numeric inputs, filter NaN values, display user-friendly error messages
- **Formatting**: 2-space indentation, semicolons, double quotes (inferred from codebase)
- **Comments**: Export functions with descriptive names; add comments for complex statistical formulas
- **UI Patterns**: Use Card, CardHeader, CardContent for sections; Label + Input/Select for forms; ResultCard for displaying calculations
