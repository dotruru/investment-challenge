# UK Investment Challenge Live Event Platform

A full-stack real-time event management platform for investment competitions, featuring live scoring, team management, and audience displays with FIFA-style animations.

## 🏗 Architecture

This is a monorepo containing:

- **Backend**: NestJS + Prisma + PostgreSQL + Redis + Socket.IO
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + Zustand

### Frontend Apps

The frontend consists of 4 separate applications:

1. **Admin Panel** (`/frontend/src/apps/admin`) - Event configuration, teams, jury management
2. **Operator Control** (`/frontend/src/apps/operator`) - Live event control, timer, stage navigation
3. **Audience Screen** (`/frontend/src/apps/audience`) - Full-screen display for projection
4. **Jury Scoring** (`/frontend/src/apps/jury`) - Mobile-friendly scoring interface

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm, npm, or yarn

### 1. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend

# Copy environment file
cp env.example .env

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed database
npm run db:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3001`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server (Admin Panel)
npm run dev
```

The Admin Panel will be available at `http://localhost:5173`

### Running Different Frontend Apps

```bash
# Admin Panel (port 5173)
npm run dev:admin

# Operator Control (port 5174)
npm run dev:operator

# Audience Screen (port 5175)
npm run dev:audience

# Jury Scoring (port 5176)
npm run dev:jury
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/admin/register` - Admin registration
- `POST /api/v1/auth/jury/login` - Jury login (access code)

### Events
- `GET /api/v1/events` - List events
- `POST /api/v1/events` - Create event
- `GET /api/v1/events/:id` - Get event details
- `PUT /api/v1/events/:id` - Update event
- `DELETE /api/v1/events/:id` - Delete event

### Teams
- `GET /api/v1/events/:id/teams` - List teams
- `POST /api/v1/events/:id/teams` - Create team
- `PUT /api/v1/events/:id/teams/:teamId` - Update team
- `DELETE /api/v1/events/:id/teams/:teamId` - Delete team

### Operator Controls
- `GET /api/v1/operator/events/:id/state` - Get live state
- `POST /api/v1/operator/events/:id/stage` - Set current stage
- `POST /api/v1/operator/events/:id/team` - Set current team
- `POST /api/v1/operator/events/:id/timer/start` - Start timer
- `POST /api/v1/operator/events/:id/timer/pause` - Pause timer
- `POST /api/v1/operator/events/:id/round/randomize` - Randomize team order

### WebSocket Events

Connect to `/event` namespace with query params:
- `eventId`: Event ID
- `clientType`: 'operator' | 'audience' | 'jury'

Events:
- `state:update` - Full state sync
- `stage:changed` - Stage changed
- `team:selected` - Team selected
- `timer:sync` - Timer synchronization
- `animation:trigger` - Animation trigger

## 🛠 Tech Stack

### Backend
- **Framework**: NestJS 10
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Cache/Pub-Sub**: Redis 7
- **Real-time**: Socket.IO
- **Auth**: JWT + Passport

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: Zustand
- **Real-time**: Socket.IO Client
- **UI Components**: Radix UI

## 📁 Project Structure

```
investment-competition/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── events/            # Events CRUD
│   │   ├── teams/             # Teams CRUD
│   │   ├── profiles/          # Profiles (jury, hosts)
│   │   ├── scoring/           # Scoring system
│   │   ├── live-state/        # Real-time state management
│   │   ├── operator/          # Operator controls
│   │   ├── jury/              # Jury endpoints
│   │   ├── websocket/         # WebSocket gateway
│   │   └── ...
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── apps/              # Separate app entry points
│   │   │   ├── admin/
│   │   │   ├── operator/
│   │   │   ├── audience/
│   │   │   └── jury/
│   │   └── shared/            # Shared components, hooks, stores
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/investment_competition"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3001
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

## 📋 Development Phases

1. ✅ **Phase 1: Foundation** - Project setup, database, auth, CRUD
2. 🔄 **Phase 2: Live State** - Redis integration, WebSocket
3. 🔄 **Phase 3: Operator Panel** - Stage navigation, timer, controls
4. 🔄 **Phase 4: Audience Screen** - All display screens
5. 🔄 **Phase 5: Jury Scoring** - Scoring forms, rankings
6. ⏳ **Phase 6: Polish** - Animations, sounds, performance
7. ⏳ **Phase 7: Deployment** - Testing, production setup

## 📄 License

MIT

