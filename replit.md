# JC's Flashcards

A web-based flashcard application using the SM-2 spaced repetition algorithm for efficient memorization.

## Overview

JC's Flashcards is a full-stack web application that helps users master any subject through scientifically-optimized review intervals. It features:

- **Spaced Repetition (SM-2)**: Cards are scheduled for review at optimal intervals based on how well you remember them
- **User Authentication**: Login via Replit Auth to save progress across sessions
- **Guest Mode**: Try the app without signing up
- **Admin Panel**: Admin users can upload and manage flashcard sets via CSV
- **Progress Tracking**: Track streaks, mastery levels, and review statistics

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Styling**: Tailwind CSS + shadcn/ui components

## Design Theme

- **Primary**: Forest Green (#2C5F4A / hsl(150 35% 32%))
- **Accent**: Warm Amber (#E8A468 / hsl(35 75% 55%))
- **Background**: Warm Off-White (#F9F7F4)
- **Font**: Inter (sans-serif), Merriweather (serif for headings)

## Key Features

### For Users
1. **Study Mode**: Review flashcards with flip animation
2. **Rating System**: Rate your recall from 0 (blackout) to 5 (perfect)
3. **Mastery Levels**: New → Learning → Review → Mastered
4. **Stats Dashboard**: Track total reviews, streaks, and accuracy

### For Admins
1. **Upload Sets**: Upload flashcard sets via CSV
2. **Manage Sets**: Delete existing sets
3. **CSV Format**: Term, Definition, Visual Metaphor (optional)

## Project Structure

```
client/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page components (Home, Admin)
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utilities (SM-2 algorithm, query client)
server/
├── routes.ts          # API endpoints
├── storage.ts         # Database operations
├── sm2.ts             # SM-2 algorithm (server)
├── db.ts              # Database connection
└── replit_integrations/auth/  # Replit Auth integration
shared/
├── schema.ts          # Drizzle database schemas
└── models/auth.ts     # Auth-related schemas
```

## API Endpoints

### Public
- `GET /api/sets` - Get all flashcard sets
- `GET /api/sets/:setId/cards/:userId` - Get cards with progress
- `POST /api/progress/rate` - Rate a card
- `GET /api/stats/:userId` - Get user stats

### Admin (requires auth)
- `GET /api/admin/check` - Check admin status
- `POST /api/admin/sets` - Create flashcard set
- `DELETE /api/admin/sets/:setId` - Delete set
- `POST /api/admin/setup` - Make current user admin

## SM-2 Algorithm

Quality ratings:
- 0-2: Failed (reset interval to 1 day)
- 3-5: Passed (increase interval based on easiness factor)

Mastery levels:
- **New**: Never reviewed
- **Learning**: < 3 successful reviews
- **Review**: 3+ reviews, still practicing
- **Mastered**: EF > 2.5 AND interval >= 21 days

## Development

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## User Preferences

- None recorded yet

## Recent Changes

- Initial implementation of JC's Flashcards web app
- Added Replit Auth integration
- Implemented SM-2 spaced repetition algorithm
- Created flashcard review, stats dashboard, and admin upload components
