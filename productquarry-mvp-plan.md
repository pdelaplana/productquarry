# ProductQuarry MVP Implementation Plan

## Project Overview

ProductQuarry is a micro-SaaS platform that helps founders collect and manage customer feedback for newly launched products. Customers can embed a feedback widget in their apps and display feedback on public boards for transparency and community engagement.

## Design System

### Color Palette
- **Primary:** `#2563eb` (Blue 600) - Trust and reliability
- **Secondary:** `#059669` (Emerald 600) - Growth and feedback  
- **Accent:** `#dc2626` (Red 600) - Urgent/bug reports
- **Neutral:** `#64748b` (Slate 500) - Text and borders
- **Background:** `#f8fafc` (Slate 50) - Clean backdrop

### Typography
- **Headings:** Inter (Google Fonts) - Clean, modern
- **Body:** Inter - Consistent, readable
- **Code:** JetBrains Mono - For API keys/scripts

### Design Principles
- Clean and minimalist design
- Responsive layout (desktop and mobile)
- Professional appearance suitable for B2B founders
- Clear visual hierarchy for feedback management

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

## Routing Structure

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

## Database Schema

### Tables

#### customers
```sql
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### boards
```sql
CREATE TABLE boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### feedback
```sql
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('bug', 'improvement', 'feedback')) NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'declined')),
  user_email TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## File Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   └── page.tsx              // Global dashboard
│   ├── [slug]/
│   │   ├── page.tsx              // Public feedback board
│   │   ├── dashboard/
│   │   │   └── page.tsx          // Board management
│   │   ├── settings/
│   │   │   └── page.tsx          // Board settings
│   │   └── layout.tsx            // Shared layout for slug routes
│   ├── api/
│   │   └── feedback/route.ts     // Feedback submission API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  // Landing page
├── components/
│   ├── ui/                       // ShadCN components
│   ├── feedback-widget.tsx       // React feedback widget
│   ├── feedback-list.tsx         // Display feedback items
│   ├── feedback-form.tsx         // Feedback submission form
│   ├── feedback-item.tsx         // Individual feedback display
│   ├── status-badge.tsx          // Status indicators
│   ├── dashboard-nav.tsx         // Navigation components
│   └── board-settings.tsx        // Board configuration
├── lib/
│   ├── supabase.ts              // Supabase client
│   ├── utils.ts                 // Utility functions
│   ├── validations.ts           // Zod schemas
│   └── auth.ts                  // Authentication helpers
├── types/
│   └── database.ts              // TypeScript types
└── public/
    └── widget.js                // Embeddable widget script
```

## MVP Features

### Core Features ✅
- **Feedback Collection Widget** - Embeddable JavaScript widget for any website
- **Public Feedback Board** - Clean display of all feedback with filtering
- **Admin Dashboard** - Manage feedback, approve submissions, update status
- **Multi-tenant Architecture** - Isolated data per customer
- **Responsive Design** - Works on desktop and mobile
- **Authentication System** - Customer signup/login
- **Board Management** - Create and configure feedback boards

### Feedback Types
- **Report a Bug** - Technical issues and errors
- **Suggest an Improvement** - Feature requests and enhancements  
- **Leave a Review** - General feedback and testimonials

### Status Management
- **Open** - New feedback awaiting review
- **In Progress** - Being worked on
- **Completed** - Implemented or resolved
- **Declined** - Not being pursued

### Excluded from MVP ❌
- Voting/upvoting system
- AI summarization and insights
- Advanced analytics and reporting
- Email notifications
- Custom branding/white-labeling
- Mobile app
- Third-party integrations (Slack, Discord)
- Advanced moderation tools
- User conversations/comments

## Implementation Timeline

### Phase 1: Foundation (Week 1)

#### Days 1-2: Project Setup
**Tasks:**
- Initialize Next.js project with TypeScript and Tailwind
- Install and configure all dependencies
- Setup Supabase project and environment variables
- Configure Biome for linting
- Setup basic project structure

**Dependencies to Install:**
```bash
npm install @supabase/supabase-js @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install @radix-ui/react-slot @radix-ui/react-dialog
npm install framer-motion lucide-react
npm install @biomejs/biome --save-dev
```

**Deliverables:**
- Working Next.js application
- Supabase project configured
- Environment variables set
- Basic file structure in place

#### Days 3-4: Database & Authentication
**Tasks:**
- Create database tables in Supabase
- Setup Row Level Security (RLS) policies
- Configure Supabase authentication
- Create TypeScript types from database schema
- Setup Tanstack Query client
- Build authentication pages (login/signup)

**Deliverables:**
- Database schema implemented
- Authentication system working
- TypeScript types generated
- Login/signup pages functional

#### Days 5-7: Global Dashboard
**Tasks:**
- Create global customer dashboard layout
- Build board creation form with React Hook Form
- Implement board listing with Tanstack Query
- Add basic board management (edit, delete)
- Setup slug validation and availability checking

**Deliverables:**
- Functional global dashboard
- Board creation and management
- Slug validation system

### Phase 2: Core Features (Week 2)

#### Days 1-3: Feedback Collection System
**Tasks:**
- Build feedback submission API endpoint (`/api/feedback`)
- Create feedback form component with validation
- Implement feedback submission with error handling
- Build basic embeddable widget (JavaScript)
- Test widget integration on simple HTML page

**API Endpoint Features:**
- Accept feedback submissions
- Validate board slug existence
- Handle approval requirements
- Return appropriate responses

**Deliverables:**
- Working feedback submission API
- Functional feedback form component
- Basic embeddable widget
- Integration testing complete

#### Days 4-5: Public Feedback Board
**Tasks:**
- Create public board page (`/{slug}/page.tsx`)
- Build feedback list component with filtering
- Implement status badges and type indicators
- Add search and filter functionality
- Handle 404 cases for invalid slugs
- Optimize for SEO with proper meta tags

**Features:**
- Display all approved feedback
- Filter by type (bug, improvement, review)
- Filter by status (open, in progress, completed, declined)
- Responsive design for mobile
- Clean, professional appearance

**Deliverables:**
- Functional public feedback boards
- Filtering and search capabilities
- Mobile-responsive design
- SEO optimization

#### Days 6-7: Admin Features
**Tasks:**
- Build board management dashboard (`/{slug}/dashboard`)
- Implement feedback approval system
- Create status update functionality
- Add feedback response capabilities
- Build feedback deletion feature
- Create board settings page

**Admin Features:**
- View all feedback (approved and pending)
- Approve/reject feedback submissions
- Update feedback status
- Respond to feedback publicly
- Delete inappropriate feedback
- Configure board settings

**Deliverables:**
- Complete admin dashboard
- Feedback moderation system
- Status management tools
- Public response capabilities

### Phase 3: Polish & Launch (Week 3)

#### Days 1-2: Widget Enhancement
**Tasks:**
- Improve widget styling and animations
- Add widget customization options (theme, position)
- Create integration documentation
- Build widget code generator for customers
- Test widget on various websites

**Widget Features:**
- Customizable appearance
- Multiple trigger styles (button, tab, modal)
- Responsive design
- Error handling and success states
- Easy integration process

**Deliverables:**
- Polished embeddable widget
- Integration documentation
- Widget customization options

#### Days 3-4: UX Improvements
**Tasks:**
- Add loading states and animations with Framer Motion
- Improve error handling across the application
- Optimize mobile experience
- Add success/confirmation messages
- Implement proper form validation feedback

**UX Enhancements:**
- Smooth transitions and animations
- Clear feedback for user actions
- Optimized mobile navigation
- Consistent design system implementation
- Accessibility improvements

**Deliverables:**
- Enhanced user experience
- Smooth animations and transitions
- Mobile optimization complete

#### Days 5-7: Launch Preparation
**Tasks:**
- Create landing page with clear value proposition
- Build pricing page structure (for future billing)
- Setup custom domain and subdomain routing
- Deploy to Vercel with environment variables
- Final testing and bug fixes
- Create initial documentation

**Launch Features:**
- Professional landing page
- Clear pricing information
- Stable production deployment
- Complete documentation
- Quality assurance testing

**Deliverables:**
- Production-ready application
- Landing and pricing pages
- Deployment configuration
- Launch documentation

## API Documentation

### Feedback Submission Endpoint

**POST** `/api/feedback`

**Request Body:**
```json
{
  "boardSlug": "acme-corp",
  "title": "Login button not working",
  "description": "When I click the login button, nothing happens...",
  "type": "bug",
  "userEmail": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "feedback": {
    "id": "uuid",
    "title": "Login button not working",
    "status": "open",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

**Response (Error):**
```json
{
  "error": "Board not found"
}
```

## Widget Integration

### Basic Integration
```html
<script>
  window.ProductQuarryConfig = {
    boardSlug: 'your-board-slug',
    theme: 'light',
    position: 'bottom-right'
  };
</script>
<script src="https://productquarry.com/widget.js"></script>
```

### React Component Integration
```jsx
import { FeedbackWidget } from '@/components/feedback-widget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <FeedbackWidget boardSlug="your-board-slug" />
    </div>
  );
}
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_APP_URL=https://productquarry.com
NEXTAUTH_SECRET=your_nextauth_secret
```

## Testing Strategy

### Unit Testing
- API endpoint functionality
- Form validation logic
- Database operations
- Authentication flows

### Integration Testing
- Widget embedding on different websites
- Feedback submission end-to-end
- Multi-tenant data isolation
- Responsive design on various devices

### User Acceptance Testing
- Customer onboarding flow
- Feedback submission experience
- Admin dashboard usability
- Public board functionality

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Setup custom domain with DNS configuration
4. Enable automatic deployments on main branch
5. Configure preview deployments for pull requests

### Domain Configuration
- Main domain: `productquarry.com`
- API endpoints: `productquarry.com/api/*`
- Customer boards: `productquarry.com/{slug}`
- Widget script: `productquarry.com/widget.js`

## Success Metrics

### Technical Metrics
- Widget integration time < 5 minutes
- Page load times < 2 seconds
- API response times < 500ms
- 99.9% uptime target

### Business Metrics
- Feedback submission rate per board
- Customer retention rate
- Average time to first feedback
- Public board engagement rate

## Security Considerations

### Data Protection
- Row Level Security (RLS) policies in Supabase
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure authentication flow

### Privacy
- Optional email collection
- Data isolation between customers
- GDPR compliance considerations
- Clear data handling policies

## Post-MVP Roadmap

### Version 2 Features
- AI-powered feedback summarization
- Advanced analytics and reporting
- Email notification system
- Voting/upvoting system
- Custom branding options

### Integration Opportunities
- Slack notifications
- Discord webhooks
- GitHub issue creation
- Zapier connectivity

### Scaling Considerations
- Database optimization
- CDN implementation for widget
- Advanced caching strategies
- Horizontal scaling planning

## Risk Mitigation

### Technical Risks
- **Database performance:** Implement proper indexing and query optimization
- **Widget compatibility:** Test across major browsers and devices
- **Security vulnerabilities:** Regular dependency updates and security audits

### Business Risks
- **Low adoption:** Focus on excellent onboarding experience
- **Competition:** Emphasize launch-focused positioning and simplicity
- **Scaling costs:** Monitor usage and implement efficient resource utilization

## Conclusion

This implementation plan provides a clear roadmap for building ProductQuarry MVP in 3 weeks. The focus is on delivering core value - feedback collection and management - while maintaining simplicity and avoiding feature creep.

The modular approach allows for easy extension with additional features post-launch, while the technical stack ensures scalability and maintainability as the product grows.

Success depends on executing this plan systematically, testing thoroughly, and maintaining focus on the core value proposition throughout development.