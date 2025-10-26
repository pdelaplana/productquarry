# ProductQuarry - Project Context

## Project Overview

ProductQuarry is a micro-SaaS platform that helps founders collect and manage customer feedback for newly launched products. Customers can embed a feedback widget in their apps and display feedback on public boards for transparency and community engagement.

## Current Status

**Project Phase:** Initial Setup
- Documents reviewed and project context established
- Ready to begin Phase 1: Foundation (Week 1)

## Technical Stack

### Frontend
- **Next.js** (App Router, latest version)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **ShadCN UI** for component library
- **Framer Motion** for animations

### Data & State Management
- **Supabase** for backend (database, auth, real-time)
- **Tanstack Query** for server state management
- **React Hook Form** for form handling
- **Zod** for validation

### Development Tools
- **Biome** for linting and formatting
- **Vercel** for deployment

## Design System

### Color Palette
- Primary: `#2563eb` (Blue 600) - Trust and reliability
- Secondary: `#059669` (Emerald 600) - Growth and feedback
- Accent: `#dc2626` (Red 600) - Urgent/bug reports
- Neutral: `#64748b` (Slate 500) - Text and borders
- Background: `#f8fafc` (Slate 50) - Clean backdrop

### Typography
- Headings & Body: Inter (Google Fonts)
- Code: JetBrains Mono

### Design Principles
- Clean and minimalist design
- Responsive layout (desktop and mobile)
- Professional B2B appearance
- Clear visual hierarchy

## Database Schema

### Tables
1. **customers** - User accounts
   - id, email, name, slug, created_at

2. **boards** - Feedback boards per customer
   - id, customer_id, name, description, slug, is_public, requires_approval, created_at

3. **feedback** - Customer feedback items
   - id, board_id, title, description, type, status, user_email, is_approved, created_at

## Application Routes

```
/ - Landing page
/auth/login - User authentication
/auth/signup - User registration
/dashboard - Global customer dashboard (all boards)
/{slug} - Public feedback board
/{slug}/dashboard - Board management/admin
/{slug}/settings - Board configuration
/api/feedback - Feedback submission endpoint
```

## Core MVP Features

### Included in MVP ✅
- Feedback collection widget (embeddable JavaScript)
- Public feedback board with filtering
- Admin dashboard for managing feedback
- Multi-tenant architecture
- Responsive design
- Authentication system
- Board management
- Three feedback types: Bug Report, Improvement, Review
- Four status types: Open, In Progress, Completed, Declined

### Excluded from MVP ❌
- Voting/upvoting system
- AI summarization and insights
- Advanced analytics
- Email notifications
- Custom branding
- Mobile app
- Third-party integrations
- Comments/conversations

## Implementation Plan

### Phase 1: Foundation (Week 1)
- Days 1-2: Project setup and dependencies
- Days 3-4: Database & authentication
- Days 5-7: Global dashboard

### Phase 2: Core Features (Week 2)
- Days 1-3: Feedback collection system
- Days 4-5: Public feedback board
- Days 6-7: Admin features

### Phase 3: Polish & Launch (Week 3)
- Days 1-2: Widget enhancement
- Days 3-4: UX improvements
- Days 5-7: Launch preparation

## Development Guidelines

### Code Quality
- Use TypeScript strictly - no `any` types without justification
- Follow Biome linting rules
- Write unit tests for core functionality
- Use Playwright for UI testing after changes
- Review code for TypeScript and linting errors after each task

### State Management
- Use Tanstack Query for all server state
- Use React Hook Form for all forms
- Validate with Zod schemas
- Keep client state minimal

### Component Structure
- Prefer ShadCN UI components
- Create reusable components in `/components`
- Keep UI components in `/components/ui`
- Feature-specific components alongside their pages

### Database Operations
- Always use Row Level Security (RLS) policies
- Validate data on both client and server
- Handle multi-tenancy through proper data isolation
- Use Supabase client helpers consistently

## Security Considerations
- Implement RLS policies for all tables
- Sanitize and validate all inputs
- Rate limit API endpoints
- Secure authentication flows
- Maintain data isolation between customers

## Project Documents

- `productquarry-mvp-features.md` - Original product vision and features
- `productquarry-mvp-plan.md` - Comprehensive 3-week implementation plan
- `PROGRESS.md` - **Implementation progress tracker** (update after each completed task)
- `claude.md` - This file - Project context and guidelines

## Notes

- Focus on simplicity and core value delivery
- Avoid feature creep - stick to MVP scope
- Test thoroughly at each phase
- Maintain clean, maintainable code for easy future expansion
- **Update PROGRESS.md after each completed task or phase**
