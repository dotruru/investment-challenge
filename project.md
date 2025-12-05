# Technical Architecture Document
## UK Investment Challenge Live Event Platform

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Data Model & Database Schema](#3-data-model--database-schema)
4. [API Design](#4-api-design)
5. [Real-Time Communication Layer](#5-real-time-communication-layer)
6. [Frontend Architecture](#6-frontend-architecture)
7. [State Machine & Event Flow](#7-state-machine--event-flow)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [File Storage & Asset Management](#9-file-storage--asset-management)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Performance & Reliability Considerations](#11-performance--reliability-considerations)
12. [Development Phases](#12-development-phases)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTS                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Admin     │  │   Operator   │  │   Audience   │  │     Jury     │         │
│  │    Panel     │  │   Control    │  │    Screen    │  │   Scoring    │         │
│  │   (Web App)  │  │    Panel     │  │  (Web App)   │  │     UI       │         │
│  │              │  │  (Web App)   │  │  Full-screen │  │   (PWA)      │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                 │                  │
└─────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │                 │
          │    HTTPS/REST   │   WebSocket     │   WebSocket     │   HTTPS/REST
          │                 │                 │                 │
┌─────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────┐
│         ▼                 ▼                 ▼                 ▼                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                           API GATEWAY / LOAD BALANCER                      │ │
│  │                              (nginx / CloudFlare)                          │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                         │
│                    ┌───────────────────┼───────────────────┐                    │
│                    ▼                   ▼                   ▼                    │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐       │
│  │     REST API         │  │   WebSocket      │  │    Background        │       │
│  │     Server           │  │   Server         │  │    Jobs/Workers      │       │
│  │   (Node.js/Express   │  │  (Socket.IO)     │  │   (Bull Queue)       │       │
│  │    or NestJS)        │  │                  │  │                      │       │
│  └──────────┬───────────┘  └────────┬─────────┘  └──────────┬───────────┘       │
│             │                       │                       │                    │
│             └───────────────────────┼───────────────────────┘                    │
│                                     │                                            │
│                    ┌────────────────┴────────────────┐                          │
│                    ▼                                 ▼                          │
│  ┌──────────────────────────┐          ┌──────────────────────────┐            │
│  │      PostgreSQL          │          │         Redis            │            │
│  │   (Primary Database)     │          │   (Cache + Pub/Sub +     │            │
│  │                          │          │    Session Store)        │            │
│  └──────────────────────────┘          └──────────────────────────┘            │
│                                                                                  │
│                    ┌──────────────────────────────────┐                         │
│                    │         Object Storage           │                         │
│                    │    (AWS S3 / Cloudflare R2)      │                         │
│                    │   (Images, PDFs, Assets)         │                         │
│                    └──────────────────────────────────┘                         │
│                                                                                  │
│                                   BACKEND                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Admin Panel** | Pre-event configuration: teams, jury, timeline, assets |
| **Operator Control Panel** | Live event control: stage transitions, timers, animations |
| **Audience Screen** | Read-only display: receives state updates via WebSocket |
| **Jury Scoring UI** | Score submission interface with real-time current team sync |
| **REST API** | CRUD operations, authentication, score calculations |
| **WebSocket Server** | Real-time state broadcasting, timer sync, animation triggers |
| **Redis** | Pub/Sub for multi-instance sync, caching, live state store |
| **PostgreSQL** | Persistent data storage |
| **Object Storage** | Static assets, uploaded files |

---

## 2. Technology Stack

### 2.1 Recommended Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  Framework:        React 18+ with TypeScript                    │
│  State Management: Zustand or Redux Toolkit                     │
│  Styling:          Tailwind CSS + Framer Motion (animations)    │
│  Real-time:        Socket.IO Client                             │
│  Build Tool:       Vite                                         │
│  UI Components:    Radix UI / Headless UI (accessible)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
├─────────────────────────────────────────────────────────────────┤
│  Runtime:          Node.js 20+ LTS                              │
│  Framework:        NestJS (recommended) or Express.js           │
│  Language:         TypeScript                                   │
│  ORM:              Prisma                                       │
│  Validation:       Zod or class-validator                       │
│  Real-time:        Socket.IO                                    │
│  Queue:            BullMQ (Redis-backed)                        │
│  Auth:             JWT + refresh tokens                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Primary DB:       PostgreSQL 15+                               │
│  Cache/Pub-Sub:    Redis 7+                                     │
│  Object Storage:   AWS S3 / Cloudflare R2 / MinIO (self-hosted) │
│  CDN:              CloudFlare / AWS CloudFront                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE                              │
├─────────────────────────────────────────────────────────────────┤
│  Containerization: Docker + Docker Compose                      │
│  Orchestration:    Kubernetes (production) or Docker Swarm      │
│  CI/CD:            GitHub Actions                               │
│  Hosting:          AWS / DigitalOcean / Railway / Render        │
│  Monitoring:       Sentry (errors) + Prometheus/Grafana         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Stack Justification

| Choice | Rationale |
|--------|-----------|
| **React + TypeScript** | Strong typing, large ecosystem, excellent animation libraries |
| **NestJS** | Structured architecture, built-in WebSocket support, dependency injection, excellent for complex business logic |
| **Socket.IO** | Reliable WebSocket abstraction with automatic reconnection, rooms, and namespaces |
| **PostgreSQL** | ACID compliance for score integrity, excellent JSON support, robust |
| **Redis** | Sub-millisecond latency for live state, Pub/Sub for multi-instance sync |
| **Prisma** | Type-safe database access, excellent migrations, good developer experience |
| **Framer Motion** | Production-ready animations matching FIFA-style reveal requirements |

---

## 3. Data Model & Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│       Event         │       │     EventStage      │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │──────<│ id (PK)             │
│ name                │       │ event_id (FK)       │
│ date                │       │ title               │
│ venue               │       │ stage_type          │
│ status              │       │ order_index         │
│ created_at          │       │ start_time_planned  │
│ updated_at          │       │ duration_minutes    │
└─────────────────────┘       │ configuration (JSON)│
                              │ created_at          │
                              └─────────────────────┘
                                        │
                                        │ 1:M
                                        ▼
                              ┌─────────────────────┐
                              │  StageScreenAsset   │
                              ├─────────────────────┤
                              │ id (PK)             │
                              │ stage_id (FK)       │
                              │ asset_type          │
                              │ url                 │
                              │ display_order       │
                              │ metadata (JSON)     │
                              └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│       Team          │       │     TeamMember      │       │   TeamScore         │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │──────<│ id (PK)             │       │ id (PK)             │
│ event_id (FK)       │       │ team_id (FK)        │   ┌──>│ team_id (FK)        │
│ name                │       │ name                │   │   │ jury_id (FK)        │
│ university          │       │ photo_url           │   │   │ round_id (FK)       │
│ rank_global         │       │ role                │   │   │ criteria_scores JSON│
│ rank_badge          │       │ quote (optional)    │   │   │ total_score         │
│ stats (JSON)        │──────<│ display_order       │   │   │ submitted_at        │
│ strategy_tagline    │       └─────────────────────┘   │   │ is_locked           │
│ strategy_tearsheet  │                                 │   └─────────────────────┘
│ avatar_card_image   │                                 │             ▲
│ round_assignment    │─────────────────────────────────┘             │
│ presentation_order  │                                               │
│ status              │                                               │
│ created_at          │                                               │
└─────────────────────┘                                               │
                                                                      │
┌─────────────────────┐       ┌─────────────────────┐                │
│   PersonProfile     │       │   ScoringCriteria   │                │
├─────────────────────┤       ├─────────────────────┤                │
│ id (PK)             │       │ id (PK)             │                │
│ event_id (FK)       │       │ event_id (FK)       │                │
│ name                │       │ name                │                │
│ role                │       │ description         │                │
│ company             │       │ max_score           │                │
│ photo_url           │       │ weight              │                │
│ bio_short           │       │ display_order       │                │
│ profile_type        │───────│ created_at          │────────────────┘
│ display_order       │       └─────────────────────┘
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│    LiveState        │
├─────────────────────┤
│ id (PK)             │  ← Singleton per event (or use Redis)
│ event_id (FK)       │
│ current_stage_id    │
│ current_team_id     │
│ timer_state (JSON)  │
│ animation_state     │
│ updated_at          │
└─────────────────────┘
```

### 3.2 Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== ENUMS ==============

enum EventStatus {
  DRAFT
  CONFIGURED
  LIVE
  COMPLETED
  ARCHIVED
}

enum StageType {
  LOBBY
  LOBBY_CARD_GRID
  WELCOME
  JURY_REVEAL
  ROUND
  BREAK
  KEYNOTE
  AWARDS
  NETWORKING
}

enum ProfileType {
  HOST
  JURY
  SPEAKER
}

enum TeamStatus {
  REGISTERED
  APPROVED
  PRESENTING
  COMPLETED
}

enum AssetType {
  BACKGROUND_IMAGE
  BACKGROUND_VIDEO
  LOGO
  ANIMATION
  AUDIO
}

enum TimerStatus {
  IDLE
  RUNNING
  PAUSED
  COMPLETED
}

// ============== MODELS ==============

model Event {
  id          String      @id @default(cuid())
  name        String
  date        DateTime
  venue       String?
  status      EventStatus @default(DRAFT)
  
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  
  // Relations
  stages            EventStage[]
  teams             Team[]
  profiles          PersonProfile[]
  scoringCriteria   ScoringCriteria[]
  liveState         LiveState?
  
  @@map("events")
}

model EventStage {
  id                  String    @id @default(cuid())
  eventId             String    @map("event_id")
  title               String
  stageType           StageType @map("stage_type")
  orderIndex          Int       @map("order_index")
  startTimePlanned    DateTime? @map("start_time_planned")
  durationMinutes     Int?      @map("duration_minutes")
  
  // Flexible configuration stored as JSON
  configuration       Json      @default("{}")
  // Example configuration:
  // {
  //   "screenTemplate": "team_card_grid",
  //   "showTimer": true,
  //   "timerDuration": 900,
  //   "autoAdvance": false,
  //   "roundNumber": 1
  // }
  
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  
  // Relations
  event               Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  assets              StageScreenAsset[]
  
  @@unique([eventId, orderIndex])
  @@map("event_stages")
}

model StageScreenAsset {
  id            String    @id @default(cuid())
  stageId       String    @map("stage_id")
  assetType     AssetType @map("asset_type")
  url           String
  displayOrder  Int       @default(0) @map("display_order")
  metadata      Json      @default("{}")
  // Example metadata: { "alt": "Partner Logo", "duration": 5000 }
  
  createdAt     DateTime  @default(now()) @map("created_at")
  
  // Relations
  stage         EventStage @relation(fields: [stageId], references: [id], onDelete: Cascade)
  
  @@map("stage_screen_assets")
}

model Team {
  id                    String     @id @default(cuid())
  eventId               String     @map("event_id")
  name                  String
  university            String
  rankGlobal            Int?       @map("rank_global")
  rankBadge             String?    @map("rank_badge") // e.g., "Gold", "Silver", "Platinum"
  
  // Stats stored as JSON for flexibility
  stats                 Json       @default("{}")
  // Example: { "performance": 15.2, "sharpe": 1.8, "sortino": 2.1 }
  
  strategyTagline       String?    @map("strategy_tagline")
  strategyTearsheetUrl  String?    @map("strategy_tearsheet_url")
  avatarCardImageUrl    String?    @map("avatar_card_image_url")
  
  roundAssignment       Int        @map("round_assignment") // 1, 2, or 3
  presentationOrder     Int?       @map("presentation_order") // Set during randomization
  status                TeamStatus @default(REGISTERED)
  
  createdAt             DateTime   @default(now()) @map("created_at")
  updatedAt             DateTime   @updatedAt @map("updated_at")
  
  // Relations
  event                 Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  members               TeamMember[]
  scores                TeamScore[]
  
  @@unique([eventId, name])
  @@index([eventId, roundAssignment])
  @@map("teams")
}

model TeamMember {
  id            String  @id @default(cuid())
  teamId        String  @map("team_id")
  name          String
  photoUrl      String? @map("photo_url")
  role          String? // e.g., "Portfolio Manager", "Risk Analyst"
  quote         String? // Optional quote for display
  displayOrder  Int     @default(0) @map("display_order")
  
  createdAt     DateTime @default(now()) @map("created_at")
  
  // Relations
  team          Team    @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  @@map("team_members")
}

model PersonProfile {
  id            String      @id @default(cuid())
  eventId       String      @map("event_id")
  name          String
  role          String      // e.g., "Co-founder, MCD Edu"
  company       String?
  photoUrl      String?     @map("photo_url")
  bioShort      String?     @map("bio_short")
  profileType   ProfileType @map("profile_type")
  displayOrder  Int         @default(0) @map("display_order")
  
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  
  // Relations
  event         Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  scores        TeamScore[] // Only for JURY type
  juryAuth      JuryAuth?   // Only for JURY type
  
  @@map("person_profiles")
}

model ScoringCriteria {
  id            String   @id @default(cuid())
  eventId       String   @map("event_id")
  name          String   // e.g., "Investment Idea Quality"
  description   String?
  maxScore      Int      @default(10) @map("max_score")
  weight        Float    @default(1.0) // For weighted scoring
  displayOrder  Int      @default(0) @map("display_order")
  
  createdAt     DateTime @default(now()) @map("created_at")
  
  // Relations
  event         Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@map("scoring_criteria")
}

model TeamScore {
  id              String   @id @default(cuid())
  teamId          String   @map("team_id")
  juryId          String   @map("jury_id")
  
  // Scores per criterion stored as JSON
  criteriaScores  Json     @map("criteria_scores")
  // Example: { "criteria_id_1": 8, "criteria_id_2": 7, "criteria_id_3": 9 }
  
  totalScore      Float?   @map("total_score") // Computed
  submittedAt     DateTime @default(now()) @map("submitted_at")
  isLocked        Boolean  @default(false) @map("is_locked")
  
  // Relations
  team            Team          @relation(fields: [teamId], references: [id], onDelete: Cascade)
  jury            PersonProfile @relation(fields: [juryId], references: [id], onDelete: Cascade)
  
  @@unique([teamId, juryId])
  @@map("team_scores")
}

model JuryAuth {
  id            String        @id @default(cuid())
  juryId        String        @unique @map("jury_id")
  accessCode    String        @unique @map("access_code") // 6-8 char unique code
  accessToken   String?       @map("access_token")
  lastLoginAt   DateTime?     @map("last_login_at")
  
  createdAt     DateTime      @default(now()) @map("created_at")
  
  // Relations
  jury          PersonProfile @relation(fields: [juryId], references: [id], onDelete: Cascade)
  
  @@map("jury_auth")
}

model LiveState {
  id                  String      @id @default(cuid())
  eventId             String      @unique @map("event_id")
  currentStageId      String?     @map("current_stage_id")
  currentTeamId       String?     @map("current_team_id")
  
  // Timer state
  timerState          Json        @default("{}") @map("timer_state")
  // Example: {
  //   "type": "presentation", // or "qa", "break"
  //   "status": "running",
  //   "durationMs": 360000,
  //   "remainingMs": 240000,
  //   "startedAt": "2024-...",
  //   "pausedAt": null
  // }
  
  // Animation state for coordinated reveals
  animationState      Json        @default("{}") @map("animation_state")
  // Example: {
  //   "currentAnimation": "jury_reveal",
  //   "step": 2,
  //   "totalSteps": 5
  // }
  
  // Round-specific state
  roundState          Json        @default("{}") @map("round_state")
  // Example: {
  //   "currentRound": 1,
  //   "teamOrder": ["team_id_1", "team_id_2", ...],
  //   "currentTeamIndex": 0,
  //   "teamsCompleted": ["team_id_1"]
  // }
  
  updatedAt           DateTime    @updatedAt @map("updated_at")
  
  // Relations
  event               Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@map("live_state")
}

// Admin users (separate from jury)
model AdminUser {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String
  role          String   @default("admin") // "admin" or "operator"
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  @@map("admin_users")
}
```

### 3.3 Redis Data Structures

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REDIS KEY PATTERNS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LIVE STATE (Hot Data - Primary Source of Truth During Event)                │
│  ─────────────────────────────────────────────────────────────               │
│  live:event:{eventId}:state          → Hash                                  │
│    {                                                                         │
│      currentStageId: "stage_123",                                            │
│      currentTeamId: "team_456",                                              │
│      timerState: "{...json...}",                                             │
│      animationState: "{...json...}",                                         │
│      roundState: "{...json...}",                                             │
│      updatedAt: "2024-01-15T14:30:00Z"                                       │
│    }                                                                         │
│                                                                              │
│  TIMER STATE (Sub-second precision needed)                                   │
│  ─────────────────────────────────────────                                   │
│  live:event:{eventId}:timer          → Hash                                  │
│    {                                                                         │
│      type: "presentation",                                                   │
│      status: "running",                                                      │
│      durationMs: 360000,                                                     │
│      serverStartTime: 1705329000000, // Unix timestamp ms                    │
│      pausedRemainingMs: null                                                 │
│    }                                                                         │
│                                                                              │
│  JURY SCORING STATUS (Quick lookups)                                         │
│  ────────────────────────────────────                                        │
│  live:event:{eventId}:scores:team:{teamId}  → Set                            │
│    ["jury_id_1", "jury_id_2"]  // IDs of jury who have scored                │
│                                                                              │
│  SESSION MANAGEMENT                                                          │
│  ──────────────────                                                          │
│  session:admin:{sessionId}           → String (JSON payload)                 │
│  session:jury:{accessCode}           → String (JSON payload)                 │
│                                                                              │
│  PUB/SUB CHANNELS                                                            │
│  ─────────────────                                                           │
│  channel:event:{eventId}:state       → State updates                         │
│  channel:event:{eventId}:timer       → Timer ticks                           │
│  channel:event:{eventId}:animation   → Animation triggers                    │
│  channel:event:{eventId}:scores      → Score submission notifications        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Design

### 4.1 API Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API STRUCTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Base URL: /api/v1                                                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ADMIN ENDPOINTS (requires admin auth)                               │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  POST   /auth/admin/login                                            │    │
│  │  POST   /auth/admin/refresh                                          │    │
│  │                                                                       │    │
│  │  GET    /events                     List all events                   │    │
│  │  POST   /events                     Create event                      │    │
│  │  GET    /events/:id                 Get event details                 │    │
│  │  PUT    /events/:id                 Update event                      │    │
│  │  DELETE /events/:id                 Delete event                      │    │
│  │                                                                       │    │
│  │  GET    /events/:id/stages          List stages                       │    │
│  │  POST   /events/:id/stages          Create stage                      │    │
│  │  PUT    /events/:id/stages/:stageId Update stage                      │    │
│  │  DELETE /events/:id/stages/:stageId Delete stage                      │    │
│  │  POST   /events/:id/stages/reorder  Reorder stages                    │    │
│  │                                                                       │    │
│  │  GET    /events/:id/teams           List teams                        │    │
│  │  POST   /events/:id/teams           Create team                       │    │
│  │  POST   /events/:id/teams/import    Bulk import (CSV)                 │    │
│  │  PUT    /events/:id/teams/:teamId   Update team                       │    │
│  │  DELETE /events/:id/teams/:teamId   Delete team                       │    │
│  │                                                                       │    │
│  │  GET    /events/:id/profiles        List profiles (hosts/jury/speakers)│   │
│  │  POST   /events/:id/profiles        Create profile                    │    │
│  │  PUT    /events/:id/profiles/:pid   Update profile                    │    │
│  │  DELETE /events/:id/profiles/:pid   Delete profile                    │    │
│  │                                                                       │    │
│  │  GET    /events/:id/criteria        List scoring criteria             │    │
│  │  POST   /events/:id/criteria        Create criterion                  │    │
│  │  PUT    /events/:id/criteria/:cid   Update criterion                  │    │
│  │                                                                       │    │
│  │  POST   /upload/image               Upload image                      │    │
│  │  POST   /upload/document            Upload PDF/document               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  OPERATOR ENDPOINTS (requires operator auth)                         │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  GET    /operator/events/:id/state        Get full live state        │    │
│  │  POST   /operator/events/:id/stage        Set current stage          │    │
│  │  POST   /operator/events/:id/team         Set current team           │    │
│  │  POST   /operator/events/:id/timer/start  Start timer                │    │
│  │  POST   /operator/events/:id/timer/pause  Pause timer                │    │
│  │  POST   /operator/events/:id/timer/reset  Reset timer                │    │
│  │  POST   /operator/events/:id/round/randomize  Randomize team order   │    │
│  │  POST   /operator/events/:id/animation/trigger  Trigger animation    │    │
│  │  POST   /operator/events/:id/animation/next     Next animation step  │    │
│  │  GET    /operator/events/:id/scores/status      Jury scoring status  │    │
│  │  POST   /operator/events/:id/awards/lock        Lock final results   │    │
│  │  GET    /operator/events/:id/awards/results     Get final rankings   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  JURY ENDPOINTS (requires jury auth via access code)                 │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  POST   /auth/jury/login            Login with access code           │    │
│  │  GET    /jury/event                 Get event info for jury          │    │
│  │  GET    /jury/teams                 List all teams to score          │    │
│  │  GET    /jury/teams/:teamId         Get team details                 │    │
│  │  GET    /jury/scores                Get jury's submitted scores      │    │
│  │  POST   /jury/scores/:teamId        Submit/update score              │    │
│  │  GET    /jury/current               Get currently presenting team    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PUBLIC ENDPOINTS (no auth - for audience screen)                    │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  GET    /public/events/:id/display  Get display-safe event data      │    │
│  │  GET    /public/events/:id/teams    Get teams (display info only)    │    │
│  │  GET    /public/events/:id/profiles Get profiles for display         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Key API Contracts

#### 4.2.1 Operator - Set Current Stage

```typescript
// POST /api/v1/operator/events/:eventId/stage

// Request
interface SetStageRequest {
  stageId: string;
}

// Response
interface SetStageResponse {
  success: boolean;
  liveState: {
    currentStageId: string;
    currentStage: {
      id: string;
      title: string;
      stageType: StageType;
      configuration: StageConfiguration;
      assets: StageAsset[];
    };
    timestamp: string;
  };
}

// Side Effects:
// 1. Updates Redis live state
// 2. Broadcasts via WebSocket to all connected clients
// 3. Persists to PostgreSQL (async, non-blocking)
```

#### 4.2.2 Operator - Randomize Round Teams

```typescript
// POST /api/v1/operator/events/:eventId/round/randomize

// Request
interface RandomizeRoundRequest {
  roundNumber: 1 | 2 | 3;
}

// Response
interface RandomizeRoundResponse {
  success: boolean;
  teamOrder: {
    position: number;
    teamId: string;
    teamName: string;
    university: string;
  }[];
  timestamp: string;
}

// Side Effects:
// 1. Updates `presentation_order` for each team in that round
// 2. Updates Redis round state
// 3. Broadcasts shuffling animation trigger via WebSocket
// 4. After animation delay, broadcasts final order
```

#### 4.2.3 Operator - Timer Controls

```typescript
// POST /api/v1/operator/events/:eventId/timer/start

// Request
interface StartTimerRequest {
  type: 'presentation' | 'qa' | 'break' | 'custom';
  durationSeconds: number;
  label?: string;  // e.g., "Presentation Time"
}

// Response
interface TimerResponse {
  success: boolean;
  timer: {
    type: string;
    status: 'running' | 'paused' | 'completed';
    durationMs: number;
    remainingMs: number;
    serverTime: number;  // Server timestamp for sync
  };
}

// Note: Timer state is primarily managed in Redis for performance
// Client sync uses server timestamp to calculate accurate remaining time
```

#### 4.2.4 Jury - Submit Score

```typescript
// POST /api/v1/jury/scores/:teamId

// Request
interface SubmitScoreRequest {
  criteriaScores: {
    criteriaId: string;
    score: number;  // 1-10
  }[];
}

// Response
interface SubmitScoreResponse {
  success: boolean;
  score: {
    teamId: string;
    criteriaScores: Record<string, number>;
    totalScore: number;  // Weighted calculation
    submittedAt: string;
  };
}

// Validation:
// - All criteria must be scored
// - Scores must be within min/max range
// - Cannot submit after awards are locked
```

---

## 5. Real-Time Communication Layer

### 5.1 WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WEBSOCKET ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         Socket.IO Server                                     │
│                              │                                               │
│           ┌──────────────────┼──────────────────┐                           │
│           │                  │                  │                           │
│           ▼                  ▼                  ▼                           │
│    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                     │
│    │  Namespace  │   │  Namespace  │   │  Namespace  │                     │
│    │  /operator  │   │  /audience  │   │    /jury    │                     │
│    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                     │
│           │                 │                 │                             │
│           ▼                 ▼                 ▼                             │
│    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                     │
│    │    Room     │   │    Room     │   │    Room     │                     │
│    │event:{id}   │   │event:{id}   │   │event:{id}   │                     │
│    └─────────────┘   └─────────────┘   └─────────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           EVENT TYPES                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SERVER → CLIENT (Broadcast)                                                 │
│  ─────────────────────────────                                               │
│  • state:update          Full state sync                                     │
│  • stage:changed         New stage activated                                 │
│  • team:selected         Current presenting team changed                     │
│  • timer:sync            Timer state update (every second when running)      │
│  • timer:warning         Timer warning (1 min, 30 sec, etc.)                 │
│  • timer:completed       Timer finished                                      │
│  • animation:trigger     Start specific animation                            │
│  • animation:step        Animation step change                               │
│  • round:randomized      Team order shuffled                                 │
│  • score:submitted       A jury member submitted a score (to operator)       │
│                                                                              │
│  CLIENT → SERVER                                                             │
│  ─────────────────                                                           │
│  • join:event            Join event room                                     │
│  • leave:event           Leave event room                                    │
│  • request:state         Request current state (reconnection)                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Socket.IO Server Implementation

```typescript
// src/websocket/event.gateway.ts (NestJS)

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/event',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  },
})
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly liveStateService: LiveStateService,
    private readonly redisService: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    const { eventId, clientType } = client.handshake.query;
    
    // Validate and authenticate based on clientType
    // 'operator' requires admin token
    // 'audience' is public
    // 'jury' requires jury token
    
    client.data.eventId = eventId;
    client.data.clientType = clientType;
  }

  handleDisconnect(client: Socket) {
    // Cleanup if needed
  }

  @SubscribeMessage('join:event')
  async handleJoinEvent(client: Socket, payload: { eventId: string }) {
    const room = `event:${payload.eventId}`;
    await client.join(room);
    
    // Send current state to newly connected client
    const state = await this.liveStateService.getState(payload.eventId);
    client.emit('state:update', state);
  }

  @SubscribeMessage('request:state')
  async handleRequestState(client: Socket) {
    const state = await this.liveStateService.getState(client.data.eventId);
    client.emit('state:update', state);
  }

  // Called by services when state changes
  broadcastStateChange(eventId: string, eventType: string, payload: any) {
    this.server.to(`event:${eventId}`).emit(eventType, payload);
  }

  // Broadcast to specific namespace/client type
  broadcastToOperator(eventId: string, eventType: string, payload: any) {
    this.server
      .to(`event:${eventId}`)
      .except('audience')
      .emit(eventType, payload);
  }
}
```

### 5.3 Timer Synchronization Strategy

```typescript
// Timer sync strategy to handle network latency

interface TimerState {
  type: 'presentation' | 'qa' | 'break';
  status: 'running' | 'paused' | 'completed';
  durationMs: number;
  serverStartTime: number;    // Unix timestamp when timer started
  pausedRemainingMs?: number; // Remaining time when paused
}

// Server broadcasts timer state, client calculates remaining time
// This handles network latency better than broadcasting remaining time

// Client-side calculation:
function calculateRemainingTime(timerState: TimerState): number {
  if (timerState.status === 'paused') {
    return timerState.pausedRemainingMs ?? 0;
  }
  if (timerState.status === 'completed') {
    return 0;
  }
  
  const elapsed = Date.now() - timerState.serverStartTime;
  return Math.max(0, timerState.durationMs - elapsed);
}

// Server sends periodic sync every second when timer is running
// Client uses local calculation between syncs for smooth display
```

### 5.4 Redis Pub/Sub for Multi-Instance Support

```typescript
// For horizontal scaling with multiple server instances

import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisPubSubService {
  private publisher: Redis;
  private subscriber: Redis;

  constructor(private eventGateway: EventGateway) {
    this.publisher = new Redis(process.env.REDIS_URL);
    this.subscriber = new Redis(process.env.REDIS_URL);
    
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.subscriber.psubscribe('event:*:broadcast');
    
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      const [, eventId, ] = channel.split(':');
      const { eventType, payload } = JSON.parse(message);
      
      // Broadcast to local WebSocket clients
      this.eventGateway.broadcastStateChange(eventId, eventType, payload);
    });
  }

  // Called when any instance needs to broadcast
  async publish(eventId: string, eventType: string, payload: any) {
    await this.publisher.publish(
      `event:${eventId}:broadcast`,
      JSON.stringify({ eventType, payload })
    );
  }
}
```

---

## 6. Frontend Architecture

### 6.1 Project Structure

```
frontend/
├── src/
│   ├── apps/                          # Separate entry points
│   │   ├── admin/                     # Admin Panel
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── main.tsx
│   │   ├── operator/                  # Live Control Panel
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── main.tsx
│   │   ├── audience/                  # Audience Display
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── main.tsx
│   │   └── jury/                      # Jury Scoring
│   │       ├── pages/
│   │       ├── components/
│   │       └── main.tsx
│   │
│   ├── shared/                        # Shared across apps
│   │   ├── components/
│   │   │   ├── ui/                    # Base UI components
│   │   │   ├── cards/                 # Team cards, profile cards
│   │   │   ├── animations/            # Framer Motion animations
│   │   │   └── timer/                 # Timer display component
│   │   ├── hooks/
│   │   │   ├── useSocket.ts           # WebSocket connection
│   │   │   ├── useLiveState.ts        # Subscribe to live state
│   │   │   ├── useTimer.ts            # Timer synchronization
│   │   │   └── useApi.ts              # API client hooks
│   │   ├── stores/                    # Zustand stores
│   │   │   ├── liveStateStore.ts
│   │   │   ├── authStore.ts
│   │   │   └── eventDataStore.ts
│   │   ├── types/                     # TypeScript types
│   │   ├── api/                       # API client
│   │   ├── utils/
│   │   └── constants/
│   │
│   └── assets/
│       ├── animations/                # Lottie files, etc.
│       ├── sounds/                    # Buzzer, reveal sounds
│       └── images/
│
├── vite.config.ts                     # Multi-app Vite config
└── package.json
```

### 6.2 Audience Screen Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AUDIENCE SCREEN COMPONENT TREE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  <AudienceApp>                                                               │
│    │                                                                         │
│    ├── <WebSocketProvider eventId={eventId}>                                 │
│    │     │                                                                   │
│    │     └── <LiveStateProvider>                                             │
│    │           │                                                             │
│    │           └── <ScreenRouter>  ← Renders based on current stage type     │
│    │                 │                                                       │
│    │                 ├── stageType === "LOBBY"                               │
│    │                 │     └── <LobbyScreen />                               │
│    │                 │           ├── <AnimatedBackground />                  │
│    │                 │           ├── <FloatingLogos partners={...} />        │
│    │                 │           └── <ScrollingMessages />                   │
│    │                 │                                                       │
│    │                 ├── stageType === "LOBBY_CARD_GRID"                     │
│    │                 │     └── <TeamCardGridScreen />                        │
│    │                 │           ├── <GridContainer>                         │
│    │                 │           │     └── {teams.map(t => <TeamCard />)}    │
│    │                 │           └── <AutoPanAnimation />                    │
│    │                 │                                                       │
│    │                 ├── stageType === "WELCOME"                             │
│    │                 │     └── <WelcomeScreen />                             │
│    │                 │           ├── <HostsDisplay hosts={...} />            │
│    │                 │           └── <PartnerLogos />                        │
│    │                 │                                                       │
│    │                 ├── stageType === "JURY_REVEAL"                         │
│    │                 │     └── <JuryRevealScreen />                          │
│    │                 │           ├── <CardRevealAnimation                    │
│    │                 │           │     jury={currentJury}                    │
│    │                 │           │     step={animationStep} />               │
│    │                 │           └── <JurySummaryRow revealed={...} />       │
│    │                 │                                                       │
│    │                 ├── stageType === "ROUND"                               │
│    │                 │     └── <PitchingRoundScreen />                       │
│    │                 │           ├── <RoundHeader round={1} />               │
│    │                 │           ├── <ProgressBar teams={...} current={} />  │
│    │                 │           ├── <TeamPresentationView                   │
│    │                 │           │     team={currentTeam}                    │
│    │                 │           │     expanded={true} />                    │
│    │                 │           │     ├── <TeamCardLarge />                 │
│    │                 │           │     ├── <TeamMembersList />               │
│    │                 │           │     ├── <StrategyDisplay />               │
│    │                 │           │     └── <StatsPanel />                    │
│    │                 │           └── <TimerDisplay timer={timerState} />     │
│    │                 │                                                       │
│    │                 ├── stageType === "BREAK"                               │
│    │                 │     └── <BreakScreen />                               │
│    │                 │           ├── <BreakMessage />                        │
│    │                 │           ├── <CountdownTimer large />                │
│    │                 │           └── <SoftBackground />                      │
│    │                 │                                                       │
│    │                 ├── stageType === "KEYNOTE"                             │
│    │                 │     └── <KeynoteScreen />                             │
│    │                 │           └── <SpeakerProfileDisplay speaker={} />    │
│    │                 │                                                       │
│    │                 ├── stageType === "AWARDS"                              │
│    │                 │     └── <AwardsScreen />                              │
│    │                 │           ├── <PodiumDisplay                          │
│    │                 │           │     first={} second={} third={} />        │
│    │                 │           └── <WinnerRevealAnimation />               │
│    │                 │                                                       │
│    │                 └── stageType === "NETWORKING"                          │
│    │                       └── <NetworkingScreen />                          │
│    │                             ├── <ThankYouMessage />                     │
│    │                             ├── <QRCodes />                             │
│    │                             └── <PartnerLogos />                        │
│    │                                                                         │
│    └── <AudioManager />  ← Handles buzzer sounds, reveal sounds              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Operator Control Panel Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OPERATOR CONTROL PANEL LAYOUT                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  HEADER BAR                                                             │ │
│  │  [Event Name]                    [Status: LIVE]     [Time: 14:32:05]   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────┐  ┌────────────────────────────────────────────┐│
│  │  STAGE NAVIGATION       │  │  MAIN CONTROL AREA                         ││
│  │  ─────────────────────  │  │  ────────────────────────────────────────  ││
│  │                         │  │                                            ││
│  │  ○ Doors Open           │  │  CURRENT STAGE: Pitching Round 1           ││
│  │  ○ Card Wall            │  │                                            ││
│  │  ○ Welcome              │  │  ┌──────────────────────────────────────┐  ││
│  │  ○ Jury Reveal          │  │  │  ROUND CONTROLS                      │  ││
│  │  ● Round 1     ← active │  │  │                                      │  ││
│  │  ○ Break 1              │  │  │  Team Order:                         │  ││
│  │  ○ Round 2              │  │  │  [1] Team Alpha ✓ done               │  ││
│  │  ○ Break 2              │  │  │  [2] Team Beta  ● presenting         │  ││
│  │  ○ Keynote 1            │  │  │  [3] Team Gamma ○                    │  ││
│  │  ○ Round 3              │  │  │  [4] Team Delta ○                    │  ││
│  │  ○ Keynote 2            │  │  │  [5] Team Omega ○                    │  ││
│  │  ○ Awards               │  │  │                                      │  ││
│  │  ○ Networking           │  │  │  [Randomize Order]  [Select Team ▼]  │  ││
│  │                         │  │  └──────────────────────────────────────┘  ││
│  │  ─────────────────────  │  │                                            ││
│  │  [◀ Prev] [Next ▶]      │  │  ┌──────────────────────────────────────┐  ││
│  │  [Jump to Stage ▼]      │  │  │  TIMER CONTROLS                      │  ││
│  │                         │  │  │                                      │  ││
│  └─────────────────────────┘  │  │         ┌─────────────────┐          │  ││
│                               │  │         │    05:42        │          │  ││
│  ┌─────────────────────────┐  │  │         │  Presentation   │          │  ││
│  │  JURY SCORING STATUS    │  │  │         └─────────────────┘          │  ││
│  │  ─────────────────────  │  │  │                                      │  ││
│  │                         │  │  │  [▶ Start Presentation (6:00)]       │  ││
│  │  Team Beta (current):   │  │  │  [▶ Start Q&A (4:00)]                │  ││
│  │  ✓ Jury 1: Sarah Chen   │  │  │  [⏸ Pause]  [↺ Reset]               │  ││
│  │  ○ Jury 2: Mark Williams│  │  │                                      │  ││
│  │  ✓ Jury 3: Elena Rossi  │  │  └──────────────────────────────────────┘  ││
│  │  ○ Jury 4: James Brown  │  │                                            ││
│  │                         │  │  ┌──────────────────────────────────────┐  ││
│  │  2/4 submitted          │  │  │  ANIMATION CONTROLS                  │  ││
│  │                         │  │  │                                      │  ││
│  └─────────────────────────┘  │  │  [Trigger Team Card Zoom]            │  ││
│                               │  │  [Show Team Details]                 │  ││
│  ┌─────────────────────────┐  │  │  [Next Team]                         │  ││
│  │  PREVIEW                │  │  │                                      │  ││
│  │  ─────────────────────  │  │  └──────────────────────────────────────┘  ││
│  │  ┌───────────────────┐  │  │                                            ││
│  │  │ Mini preview of   │  │  └────────────────────────────────────────────┘│
│  │  │ audience screen   │  │                                                │
│  │  │                   │  │                                                │
│  │  └───────────────────┘  │                                                │
│  └─────────────────────────┘                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Key Animation Components (Framer Motion)

```typescript
// src/shared/components/animations/CardRevealAnimation.tsx

import { motion, AnimatePresence } from 'framer-motion';

interface CardRevealAnimationProps {
  profile: JuryProfile | TeamProfile;
  isRevealed: boolean;
  onComplete?: () => void;
}

export const CardRevealAnimation: React.FC<CardRevealAnimationProps> = ({
  profile,
  isRevealed,
  onComplete,
}) => {
  return (
    <div className="relative w-80 h-96">
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          // Silhouette/mystery card
          <motion.div
            key="hidden"
            className="absolute inset-0 bg-gradient-to-br from-gold-400 to-gold-600 
                       rounded-xl shadow-2xl"
            initial={{ rotateY: 0, scale: 0.8 }}
            animate={{ 
              rotateY: [0, 5, -5, 0],
              scale: [0.8, 1.02, 1],
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center h-full">
              <span className="text-6xl">?</span>
            </div>
          </motion.div>
        ) : (
          // Revealed card with FIFA-style animation
          <motion.div
            key="revealed"
            className="absolute inset-0"
            initial={{ rotateY: 90, scale: 0.8 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            onAnimationComplete={onComplete}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-radial from-yellow-400/50 to-transparent"
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: [0, 1, 0], scale: [1.5, 1.2, 1] }}
              transition={{ duration: 0.8 }}
            />
            
            {/* Actual card */}
            <ProfileCard profile={profile} size="large" />
            
            {/* Particle effects */}
            <ParticleExplosion trigger={isRevealed} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

```typescript
// src/shared/components/animations/TeamCardGrid.tsx

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    transition: { duration: 0.2 },
  },
};

export const TeamCardGrid: React.FC<{ teams: Team[] }> = ({ teams }) => {
  return (
    <motion.div
      className="grid grid-cols-5 gap-6 p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {teams.map((team) => (
        <motion.div
          key={team.id}
          variants={cardVariants}
          whileHover="hover"
          layoutId={`team-card-${team.id}`}
        >
          <TeamCard team={team} size="medium" />
        </motion.div>
      ))}
    </motion.div>
  );
};
```

### 6.5 Live State Hook

```typescript
// src/shared/hooks/useLiveState.ts

import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useLiveStateStore } from '../stores/liveStateStore';

export function useLiveState(eventId: string) {
  const socket = useSocket();
  const { 
    state, 
    setCurrentStage, 
    setCurrentTeam, 
    setTimerState,
    setAnimationState,
    setFullState,
  } = useLiveStateStore();

  useEffect(() => {
    if (!socket || !eventId) return;

    // Join event room
    socket.emit('join:event', { eventId });

    // Listen for state updates
    socket.on('state:update', (newState) => {
      setFullState(newState);
    });

    socket.on('stage:changed', ({ stage }) => {
      setCurrentStage(stage);
    });

    socket.on('team:selected', ({ team }) => {
      setCurrentTeam(team);
    });

    socket.on('timer:sync', (timerState) => {
      setTimerState(timerState);
    });

    socket.on('animation:trigger', ({ animation, params }) => {
      setAnimationState({ type: animation, params, triggered: Date.now() });
    });

    // Request initial state
    socket.emit('request:state');

    return () => {
      socket.off('state:update');
      socket.off('stage:changed');
      socket.off('team:selected');
      socket.off('timer:sync');
      socket.off('animation:trigger');
      socket.emit('leave:event', { eventId });
    };
  }, [socket, eventId]);

  return state;
}
```

---

## 7. State Machine & Event Flow

### 7.1 Event Stage State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EVENT STAGE STATE MACHINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────┐                                 │
│                              │    DRAFT    │                                 │
│                              │  (Pre-event)│                                 │
│                              └──────┬──────┘                                 │
│                                     │ admin: startEvent()                    │
│                                     ▼                                        │
│  ┌─────────┐    next    ┌─────────────────┐    next    ┌─────────┐          │
│  │  LOBBY  │◄──────────►│   CARD_GRID     │◄──────────►│ WELCOME │          │
│  └─────────┘            └─────────────────┘            └────┬────┘          │
│                                                              │               │
│                                         ┌────────────────────┘               │
│                                         ▼                                    │
│                              ┌─────────────────┐                             │
│                              │   JURY_REVEAL   │                             │
│                              │  ┌───────────┐  │                             │
│                              │  │ step: 0-N │  │  (internal steps)           │
│                              │  └───────────┘  │                             │
│                              └────────┬────────┘                             │
│                                       │                                      │
│        ┌──────────────────────────────┼──────────────────────────────┐      │
│        ▼                              ▼                              ▼      │
│  ┌───────────┐                 ┌───────────┐                  ┌───────────┐ │
│  │  ROUND 1  │────► BREAK ────►│  ROUND 2  │────► BREAK ─────►│  ROUND 3  │ │
│  └───────────┘        1        └───────────┘        2         └───────────┘ │
│        │                              │                              │      │
│        └──────────────────────────────┼──────────────────────────────┘      │
│                                       │                                      │
│                              (each ROUND has internal state machine)         │
│                                       │                                      │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │    KEYNOTE 1    │                             │
│                              └────────┬────────┘                             │
│                                       │                                      │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │    KEYNOTE 2    │                             │
│                              └────────┬────────┘                             │
│                                       │                                      │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │     AWARDS      │                             │
│                              │  ┌───────────┐  │                             │
│                              │  │reveal: 3,2,1│ │                            │
│                              │  └───────────┘  │                             │
│                              └────────┬────────┘                             │
│                                       │                                      │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │   NETWORKING    │                             │
│                              │    (final)      │                             │
│                              └─────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Round Internal State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROUND STATE MACHINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────────┐                             │
│                              │  ROUND_START    │                             │
│                              │ (show round #)  │                             │
│                              └────────┬────────┘                             │
│                                       │ operator: showLineup()               │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │ LINEUP_PREVIEW  │                             │
│                              │ (show 5 cards)  │                             │
│                              └────────┬────────┘                             │
│                                       │ operator: randomize()                │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │  RANDOMIZING    │                             │
│                              │ (shuffle anim)  │                             │
│                              └────────┬────────┘                             │
│                                       │ animation complete                   │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │ LINEUP_FINAL    │                             │
│                              │ (order set)     │                             │
│                              └────────┬────────┘                             │
│                                       │ operator: selectTeam(0)              │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         TEAM PRESENTATION LOOP                          ││
│  │                                                                          ││
│  │    ┌───────────────┐                                                    ││
│  │    │ TEAM_SELECTED │ ◄────────────────────────────────────────┐         ││
│  │    │ (zoom to card)│                                          │         ││
│  │    └───────┬───────┘                                          │         ││
│  │            │ operator: expandTeam()                           │         ││
│  │            ▼                                                  │         ││
│  │    ┌───────────────┐                                          │         ││
│  │    │ TEAM_EXPANDED │                                          │         ││
│  │    │ (full details)│                                          │         ││
│  │    └───────┬───────┘                                          │         ││
│  │            │ operator: startPresentationTimer()               │         ││
│  │            ▼                                                  │         ││
│  │    ┌───────────────┐                                          │         ││
│  │    │ PRESENTING    │                                          │         ││
│  │    │ (6 min timer) │                                          │         ││
│  │    └───────┬───────┘                                          │         ││
│  │            │ timer complete OR operator: startQA()            │         ││
│  │            ▼                                                  │         ││
│  │    ┌───────────────┐                                          │         ││
│  │    │    Q&A        │                                          │         ││
│  │    │ (4 min timer) │                                          │         ││
│  │    └───────┬───────┘                                          │         ││
│  │            │ timer complete OR operator: completeTeam()       │         ││
│  │            ▼                                                  │         ││
│  │    ┌───────────────┐         more teams?                      │         ││
│  │    │ TEAM_COMPLETE │ ─────────────────────────────────────────┘         ││
│  │    │ (mark done)   │         yes: operator: nextTeam()                  ││
│  │    └───────┬───────┘                                                    ││
│  │            │ no more teams                                              ││
│  └────────────┼────────────────────────────────────────────────────────────┘│
│               ▼                                                              │
│        ┌───────────────┐                                                    │
│        │ ROUND_COMPLETE│                                                    │
│        │ (summary view)│                                                    │
│        └───────────────┘                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
## 7. State Machine & Event Flow (Continued)

### 7.3 State Machine Implementation (Continued)

```typescript
// src/backend/services/state-machine.service.ts (continued)

import { createMachine, interpret, assign } from 'xstate';

// Round state machine
export const roundMachine = createMachine({
  id: 'round',
  initial: 'roundStart',
  context: {
    roundNumber: 1,
    teams: [] as Team[],
    currentTeamIndex: -1,
    completedTeams: [] as string[],
  },
  states: {
    roundStart: {
      on: {
        SHOW_LINEUP: 'lineupPreview',
      },
    },
    lineupPreview: {
      on: {
        RANDOMIZE: 'randomizing',
      },
    },
    randomizing: {
      invoke: {
        src: 'randomizeTeams',
        onDone: {
          target: 'lineupFinal',
          actions: 'setTeamOrder',
        },
      },
    },
    lineupFinal: {
      on: {
        SELECT_FIRST_TEAM: {
          target: 'teamSelected',
          actions: assign({ currentTeamIndex: 0 }),
        },
      },
    },
    teamSelected: {
      on: {
        EXPAND_TEAM: 'teamExpanded',
      },
    },
    teamExpanded: {
      on: {
        START_PRESENTATION: 'presenting',
      },
    },
    presenting: {
      on: {
        START_QA: 'qa',
        TIMER_COMPLETE: 'qa',
      },
    },
    qa: {
      on: {
        COMPLETE_TEAM: [
          {
            target: 'teamSelected',
            cond: 'hasMoreTeams',
            actions: ['markTeamComplete', 'selectNextTeam'],
          },
          {
            target: 'roundComplete',
            actions: 'markTeamComplete',
          },
        ],
      },
    },
    roundComplete: {
      type: 'final',
    },
  },
}, {
  guards: {
    hasMoreTeams: (context) => {
      return context.currentTeamIndex < context.teams.length - 1;
    },
  },
  actions: {
    setTeamOrder: assign({
      teams: (_, event) => event.data.teams,
    }),
    markTeamComplete: assign({
      completedTeams: (context) => [
        ...context.completedTeams,
        context.teams[context.currentTeamIndex].id,
      ],
    }),
    selectNextTeam: assign({
      currentTeamIndex: (context) => context.currentTeamIndex + 1,
    }),
  },
  services: {
    randomizeTeams: async (context) => {
      // Fisher-Yates shuffle
      const shuffled = [...context.teams];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return { teams: shuffled };
    },
  },
});

// Awards reveal state machine
export const awardsMachine = createMachine({
  id: 'awards',
  initial: 'intro',
  context: {
    rankings: [] as TeamRanking[],
    revealedPositions: [] as number[],
  },
  states: {
    intro: {
      on: {
        START_REVEALS: 'revealThird',
      },
    },
    revealThird: {
      entry: 'triggerThirdPlaceAnimation',
      on: {
        REVEAL_COMPLETE: 'thirdRevealed',
      },
    },
    thirdRevealed: {
      on: {
        CONTINUE: 'revealSecond',
      },
    },
    revealSecond: {
      entry: 'triggerSecondPlaceAnimation',
      on: {
        REVEAL_COMPLETE: 'secondRevealed',
      },
    },
    secondRevealed: {
      on: {
        CONTINUE: 'revealFirst',
      },
    },
    revealFirst: {
      entry: 'triggerFirstPlaceAnimation',
      on: {
        REVEAL_COMPLETE: 'allRevealed',
      },
    },
    allRevealed: {
      type: 'final',
    },
  },
});
```

### 7.4 Live State Service

```typescript
// src/backend/services/live-state.service.ts

import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from './prisma.service';
import { EventGateway } from '../websocket/event.gateway';

interface LiveState {
  eventId: string;
  currentStageId: string | null;
  currentStage: EventStage | null;
  currentTeamId: string | null;
  currentTeam: Team | null;
  timerState: TimerState | null;
  animationState: AnimationState | null;
  roundState: RoundState | null;
}

interface TimerState {
  type: 'presentation' | 'qa' | 'break' | 'custom';
  status: 'idle' | 'running' | 'paused' | 'completed';
  durationMs: number;
  serverStartTime: number | null;
  pausedRemainingMs: number | null;
  label?: string;
}

interface RoundState {
  roundNumber: number;
  teamOrder: string[];
  currentTeamIndex: number;
  completedTeamIds: string[];
  machineState: string;
}

@Injectable()
export class LiveStateService {
  private redis: Redis;
  private timerIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private prisma: PrismaService,
    private eventGateway: EventGateway,
  ) {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // ============== STATE RETRIEVAL ==============

  async getState(eventId: string): Promise<LiveState> {
    const cacheKey = `live:event:${eventId}:state`;
    const cached = await this.redis.hgetall(cacheKey);

    if (Object.keys(cached).length > 0) {
      return this.deserializeState(cached, eventId);
    }

    // Fallback to database
    const dbState = await this.prisma.liveState.findUnique({
      where: { eventId },
      include: {
        event: {
          include: {
            stages: true,
            teams: { include: { members: true } },
          },
        },
      },
    });

    if (dbState) {
      await this.cacheState(eventId, dbState);
      return this.formatState(dbState);
    }

    // Initialize empty state
    return this.initializeState(eventId);
  }

  private async initializeState(eventId: string): Promise<LiveState> {
    const state: LiveState = {
      eventId,
      currentStageId: null,
      currentStage: null,
      currentTeamId: null,
      currentTeam: null,
      timerState: null,
      animationState: null,
      roundState: null,
    };

    await this.prisma.liveState.create({
      data: {
        eventId,
        timerState: {},
        animationState: {},
        roundState: {},
      },
    });

    return state;
  }

  // ============== STAGE MANAGEMENT ==============

  async setCurrentStage(eventId: string, stageId: string): Promise<LiveState> {
    const stage = await this.prisma.eventStage.findUnique({
      where: { id: stageId },
      include: { assets: true },
    });

    if (!stage || stage.eventId !== eventId) {
      throw new Error('Stage not found or does not belong to event');
    }

    // Update Redis
    await this.redis.hset(`live:event:${eventId}:state`, {
      currentStageId: stageId,
      currentStage: JSON.stringify(stage),
      updatedAt: new Date().toISOString(),
    });

    // Persist to database (async, non-blocking)
    this.persistToDatabase(eventId, { currentStageId: stageId });

    // Broadcast to all clients
    const state = await this.getState(eventId);
    this.eventGateway.broadcastStateChange(eventId, 'stage:changed', {
      stage,
      state,
    });

    return state;
  }

  // ============== TEAM MANAGEMENT ==============

  async setCurrentTeam(eventId: string, teamId: string): Promise<LiveState> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team || team.eventId !== eventId) {
      throw new Error('Team not found or does not belong to event');
    }

    // Update team status
    await this.prisma.team.update({
      where: { id: teamId },
      data: { status: 'PRESENTING' },
    });

    // Update Redis
    await this.redis.hset(`live:event:${eventId}:state`, {
      currentTeamId: teamId,
      currentTeam: JSON.stringify(team),
      updatedAt: new Date().toISOString(),
    });

    // Broadcast
    const state = await this.getState(eventId);
    this.eventGateway.broadcastStateChange(eventId, 'team:selected', {
      team,
      state,
    });

    return state;
  }

  async randomizeRoundTeams(
    eventId: string,
    roundNumber: number,
  ): Promise<{ teams: Team[]; order: string[] }> {
    // Get teams for this round
    const teams = await this.prisma.team.findMany({
      where: { eventId, roundAssignment: roundNumber },
      include: { members: true },
    });

    // Shuffle using Fisher-Yates
    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Update presentation order in database
    await Promise.all(
      shuffled.map((team, index) =>
        this.prisma.team.update({
          where: { id: team.id },
          data: { presentationOrder: index + 1 },
        }),
      ),
    );

    // Update round state in Redis
    const roundState: RoundState = {
      roundNumber,
      teamOrder: shuffled.map((t) => t.id),
      currentTeamIndex: -1,
      completedTeamIds: [],
      machineState: 'lineupFinal',
    };

    await this.redis.hset(`live:event:${eventId}:state`, {
      roundState: JSON.stringify(roundState),
    });

    // Broadcast randomization animation
    this.eventGateway.broadcastStateChange(eventId, 'round:randomized', {
      roundNumber,
      teams: shuffled,
      animationType: 'shuffle',
    });

    return { teams: shuffled, order: shuffled.map((t) => t.id) };
  }

  // ============== TIMER MANAGEMENT ==============

  async startTimer(
    eventId: string,
    type: TimerState['type'],
    durationSeconds: number,
    label?: string,
  ): Promise<TimerState> {
    const durationMs = durationSeconds * 1000;
    const timerState: TimerState = {
      type,
      status: 'running',
      durationMs,
      serverStartTime: Date.now(),
      pausedRemainingMs: null,
      label,
    };

    await this.redis.hset(`live:event:${eventId}:state`, {
      timerState: JSON.stringify(timerState),
    });

    // Broadcast initial state
    this.eventGateway.broadcastStateChange(eventId, 'timer:sync', timerState);

    // Start periodic sync (every second)
    this.startTimerSync(eventId, timerState);

    return timerState;
  }

  async pauseTimer(eventId: string): Promise<TimerState> {
    const stateJson = await this.redis.hget(
      `live:event:${eventId}:state`,
      'timerState',
    );
    if (!stateJson) throw new Error('No timer running');

    const currentState: TimerState = JSON.parse(stateJson);
    if (currentState.status !== 'running') {
      throw new Error('Timer is not running');
    }

    const elapsed = Date.now() - currentState.serverStartTime!;
    const remaining = Math.max(0, currentState.durationMs - elapsed);

    const pausedState: TimerState = {
      ...currentState,
      status: 'paused',
      pausedRemainingMs: remaining,
      serverStartTime: null,
    };

    await this.redis.hset(`live:event:${eventId}:state`, {
      timerState: JSON.stringify(pausedState),
    });

    // Stop sync interval
    this.stopTimerSync(eventId);

    this.eventGateway.broadcastStateChange(eventId, 'timer:sync', pausedState);

    return pausedState;
  }

  async resumeTimer(eventId: string): Promise<TimerState> {
    const stateJson = await this.redis.hget(
      `live:event:${eventId}:state`,
      'timerState',
    );
    if (!stateJson) throw new Error('No timer to resume');

    const currentState: TimerState = JSON.parse(stateJson);
    if (currentState.status !== 'paused') {
      throw new Error('Timer is not paused');
    }

    const resumedState: TimerState = {
      ...currentState,
      status: 'running',
      serverStartTime: Date.now(),
      durationMs: currentState.pausedRemainingMs!,
      pausedRemainingMs: null,
    };

    await this.redis.hset(`live:event:${eventId}:state`, {
      timerState: JSON.stringify(resumedState),
    });

    this.eventGateway.broadcastStateChange(eventId, 'timer:sync', resumedState);
    this.startTimerSync(eventId, resumedState);

    return resumedState;
  }

  async resetTimer(eventId: string): Promise<void> {
    this.stopTimerSync(eventId);

    const resetState: TimerState = {
      type: 'presentation',
      status: 'idle',
      durationMs: 0,
      serverStartTime: null,
      pausedRemainingMs: null,
    };

    await this.redis.hset(`live:event:${eventId}:state`, {
      timerState: JSON.stringify(resetState),
    });

    this.eventGateway.broadcastStateChange(eventId, 'timer:sync', resetState);
  }

  private startTimerSync(eventId: string, initialState: TimerState) {
    // Clear any existing interval
    this.stopTimerSync(eventId);

    const interval = setInterval(async () => {
      const stateJson = await this.redis.hget(
        `live:event:${eventId}:state`,
        'timerState',
      );
      if (!stateJson) {
        this.stopTimerSync(eventId);
        return;
      }

      const state: TimerState = JSON.parse(stateJson);
      if (state.status !== 'running') {
        this.stopTimerSync(eventId);
        return;
      }

      const elapsed = Date.now() - state.serverStartTime!;
      const remaining = state.durationMs - elapsed;

      // Broadcast sync
      this.eventGateway.broadcastStateChange(eventId, 'timer:sync', state);

      // Check for warnings
      if (remaining <= 60000 && remaining > 59000) {
        this.eventGateway.broadcastStateChange(eventId, 'timer:warning', {
          secondsRemaining: 60,
        });
      } else if (remaining <= 30000 && remaining > 29000) {
        this.eventGateway.broadcastStateChange(eventId, 'timer:warning', {
          secondsRemaining: 30,
        });
      }

      // Check for completion
      if (remaining <= 0) {
        const completedState: TimerState = {
          ...state,
          status: 'completed',
        };

        await this.redis.hset(`live:event:${eventId}:state`, {
          timerState: JSON.stringify(completedState),
        });

        this.eventGateway.broadcastStateChange(
          eventId,
          'timer:completed',
          completedState,
        );
        this.stopTimerSync(eventId);
      }
    }, 1000);

    this.timerIntervals.set(eventId, interval);
  }

  private stopTimerSync(eventId: string) {
    const interval = this.timerIntervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.timerIntervals.delete(eventId);
    }
  }

  // ============== ANIMATION TRIGGERS ==============

  async triggerAnimation(
    eventId: string,
    animationType: string,
    params: Record<string, any> = {},
  ): Promise<void> {
    const animationState = {
      type: animationType,
      params,
      triggeredAt: Date.now(),
      step: 0,
    };

    await this.redis.hset(`live:event:${eventId}:state`, {
      animationState: JSON.stringify(animationState),
    });

    this.eventGateway.broadcastStateChange(eventId, 'animation:trigger', {
      animation: animationType,
      params,
    });
  }

  async advanceAnimationStep(eventId: string): Promise<number> {
    const stateJson = await this.redis.hget(
      `live:event:${eventId}:state`,
      'animationState',
    );
    if (!stateJson) throw new Error('No animation in progress');

    const state = JSON.parse(stateJson);
    state.step += 1;

    await this.redis.hset(`live:event:${eventId}:state`, {
      animationState: JSON.stringify(state),
    });

    this.eventGateway.broadcastStateChange(eventId, 'animation:step', {
      step: state.step,
      animation: state.type,
    });

    return state.step;
  }

  // ============== PERSISTENCE ==============

  private async persistToDatabase(
    eventId: string,
    updates: Partial<{
      currentStageId: string;
      currentTeamId: string;
      timerState: any;
      roundState: any;
      animationState: any;
    }>,
  ): Promise<void> {
    // Non-blocking database update
    setImmediate(async () => {
      try {
        await this.prisma.liveState.update({
          where: { eventId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Failed to persist live state:', error);
      }
    });
  }

  private async cacheState(eventId: string, dbState: any): Promise<void> {
    await this.redis.hset(`live:event:${eventId}:state`, {
      currentStageId: dbState.currentStageId || '',
      currentTeamId: dbState.currentTeamId || '',
      timerState: JSON.stringify(dbState.timerState || {}),
      roundState: JSON.stringify(dbState.roundState || {}),
      animationState: JSON.stringify(dbState.animationState || {}),
      updatedAt: dbState.updatedAt?.toISOString() || new Date().toISOString(),
    });

    // Set TTL for cache (1 hour)
    await this.redis.expire(`live:event:${eventId}:state`, 3600);
  }

  private deserializeState(cached: Record<string, string>, eventId: string): LiveState {
    return {
      eventId,
      currentStageId: cached.currentStageId || null,
      currentStage: cached.currentStage ? JSON.parse(cached.currentStage) : null,
      currentTeamId: cached.currentTeamId || null,
      currentTeam: cached.currentTeam ? JSON.parse(cached.currentTeam) : null,
      timerState: cached.timerState ? JSON.parse(cached.timerState) : null,
      animationState: cached.animationState ? JSON.parse(cached.animationState) : null,
      roundState: cached.roundState ? JSON.parse(cached.roundState) : null,
    };
  }

  private formatState(dbState: any): LiveState {
    return {
      eventId: dbState.eventId,
      currentStageId: dbState.currentStageId,
      currentStage: null, // Would need to fetch
      currentTeamId: dbState.currentTeamId,
      currentTeam: null,
      timerState: dbState.timerState,
      animationState: dbState.animationState,
      roundState: dbState.roundState,
    };
  }
}
```

---

## 8. Authentication & Authorization

### 8.1 Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         ADMIN / OPERATOR                             │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                       │    │
│  │  Method: Email + Password → JWT                                       │    │
│  │                                                                       │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │    │
│  │  │   Login     │───►│  Validate   │───►│ Issue JWT   │               │    │
│  │  │  Request    │    │  Password   │    │  + Refresh  │               │    │
│  │  └─────────────┘    └─────────────┘    └─────────────┘               │    │
│  │                                                                       │    │
│  │  Access Token: 15 min expiry, stored in memory                       │    │
│  │  Refresh Token: 7 day expiry, HTTP-only cookie                       │    │
│  │                                                                       │    │
│  │  JWT Payload:                                                         │    │
│  │  {                                                                    │    │
│  │    sub: "user_id",                                                    │    │
│  │    email: "admin@example.com",                                        │    │
│  │    role: "admin" | "operator",                                        │    │
│  │    iat: 1234567890,                                                   │    │
│  │    exp: 1234568790                                                    │    │
│  │  }                                                                    │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                              JURY                                     │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                       │    │
│  │  Method: Unique Access Code → JWT                                     │    │
│  │                                                                       │    │
│  │  Flow:                                                                │    │
│  │  1. Admin generates unique 8-char code per jury member               │    │
│  │  2. Jury enters code on login screen                                 │    │
│  │  3. Server validates code, returns JWT                                │    │
│  │                                                                       │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │    │
│  │  │ Enter Code  │───►│  Validate   │───►│ Issue JWT   │               │    │
│  │  │  "XK7M2P9Q" │    │  vs DB      │    │  (jury)     │               │    │
│  │  └─────────────┘    └─────────────┘    └─────────────┘               │    │
│  │                                                                       │    │
│  │  JWT Payload:                                                         │    │
│  │  {                                                                    │    │
│  │    sub: "jury_profile_id",                                            │    │
│  │    role: "jury",                                                      │    │
│  │    eventId: "event_123",                                              │    │
│  │    name: "Sarah Chen",                                                │    │
│  │    iat: 1234567890,                                                   │    │
│  │    exp: 1234654290  // 24 hours                                       │    │
│  │  }                                                                    │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                            AUDIENCE                                   │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                       │    │
│  │  Method: No authentication required                                   │    │
│  │                                                                       │    │
│  │  Access: Public URL with event ID                                     │    │
│  │  Example: /audience/event/evt_abc123                                 │    │
│  │                                                                       │    │
│  │  Security: Read-only access, no sensitive data exposed               │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Authorization Matrix

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          AUTHORIZATION MATRIX                                 │
├────────────────────┬─────────┬──────────┬─────────┬──────────────────────────┤
│  Resource/Action   │  Admin  │ Operator │  Jury   │  Audience (Public)       │
├────────────────────┼─────────┼──────────┼─────────┼──────────────────────────┤
│  Events            │         │          │         │                          │
│  ├─ Create         │   ✓     │    ✗     │   ✗     │         ✗                │
│  ├─ Read (full)    │   ✓     │    ✓     │   ✗     │         ✗                │
│  ├─ Read (display) │   ✓     │    ✓     │   ✓     │         ✓                │
│  ├─ Update         │   ✓     │    ✗     │   ✗     │         ✗                │
│  └─ Delete         │   ✓     │    ✗     │   ✗     │         ✗                │
├────────────────────┼─────────┼──────────┼─────────┼──────────────────────────┤
│  Teams             │         │          │         │                          │
│  ├─ Create         │   ✓     │    ✗     │   ✗     │         ✗                │
│  ├─ Read (full)    │   ✓     │    ✓     │   ✓     │         ✗                │
│  ├─ Read (display) │   ✓     │    ✓     │   ✓     │         ✓                │
│  ├─ Update         │   ✓     │    ✗     │   ✗     │         ✗                │
│  └─ Randomize      │   ✓     │    ✓     │   ✗     │         ✗                │
├────────────────────┼─────────┼──────────┼─────────┼──────────────────────────┤
│  Live State        │         │          │         │                          │
│  ├─ Read           │   ✓     │    ✓     │   ✓*    │         ✓                │
│  ├─ Change Stage   │   ✓     │    ✓     │   ✗     │         ✗                │
│  ├─ Control Timer  │   ✓     │    ✓     │   ✗     │         ✗                │
│  └─ Trigger Anim   │   ✓     │    ✓     │   ✗     │         ✗                │
├────────────────────┼─────────┼──────────┼─────────┼──────────────────────────┤
│  Scores            │         │          │         │                          │
│  ├─ Submit         │   ✗     │    ✗     │   ✓**   │         ✗                │
│  ├─ Read (own)     │   ✓     │    ✓     │   ✓     │         ✗                │
│  ├─ Read (all)     │   ✓     │    ✓***  │   ✗     │         ✗                │
│  └─ Lock Results   │   ✓     │    ✓     │   ✗     │         ✗                │
├────────────────────┼─────────┼──────────┼─────────┼──────────────────────────┤
│  Profiles          │         │          │         │                          │
│  ├─ Create         │   ✓     │    ✗     │   ✗     │         ✗                │
│  ├─ Read           │   ✓     │    ✓     │   ✓     │         ✓                │
│  └─ Update         │   ✓     │    ✗     │   ✗     │         ✗                │
└────────────────────┴─────────┴──────────┴─────────┴──────────────────────────┘

Notes:
  *   Jury receives current team info only
  **  Jury can only submit for teams they haven't scored, before lock
  *** Operator sees submission status only (not actual scores during event)
```

### 8.3 JWT Implementation

```typescript
// src/backend/auth/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  role: 'admin' | 'operator' | 'jury';
  email?: string;
  eventId?: string;
  name?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      eventId: payload.eventId,
      name: payload.name,
    };
  }
}

// src/backend/auth/auth.service.ts

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  // Admin/Operator login
  async loginAdmin(email: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  // Jury login
  async loginJury(accessCode: string) {
    const juryAuth = await this.prisma.juryAuth.findUnique({
      where: { accessCode: accessCode.toUpperCase() },
      include: {
        jury: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!juryAuth) {
      throw new UnauthorizedException('Invalid access code');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: juryAuth.juryId,
        role: 'jury',
        eventId: juryAuth.jury.eventId,
        name: juryAuth.jury.name,
      },
      { expiresIn: '24h' },
    );

    // Update last login
    await this.prisma.juryAuth.update({
      where: { id: juryAuth.id },
      data: {
        accessToken,
        lastLoginAt: new Date(),
      },
    });

    return {
      accessToken,
      jury: {
        id: juryAuth.jury.id,
        name: juryAuth.jury.name,
        eventId: juryAuth.jury.eventId,
        eventName: juryAuth.jury.event.name,
      },
    };
  }

  // Generate unique jury access code
  generateAccessCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }
}

// src/backend/auth/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage in controller:
// @Roles('admin', 'operator')
// @UseGuards(JwtAuthGuard, RolesGuard)
// async controlMethod() { ... }
```

---

## 9. File Storage & Asset Management

### 9.1 Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FILE STORAGE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────────┐                             │
│                              │    Client       │                             │
│                              │    Upload       │                             │
│                              └────────┬────────┘                             │
│                                       │                                      │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │   API Server    │                             │
│                              │ (file handling) │                             │
│                              └────────┬────────┘                             │
│                                       │                                      │
│                    ┌──────────────────┼──────────────────┐                  │
│                    │                  │                  │                  │
│                    ▼                  ▼                  ▼                  │
│           ┌──────────────┐   ┌──────────────┐   ┌──────────────┐           │
│           │   Validate   │   │   Process    │   │   Generate   │           │
│           │  (type/size) │   │  (resize/    │   │  (thumbnail) │           │
│           │              │   │   optimize)  │   │              │           │
│           └──────────────┘   └──────────────┘   └──────────────┘           │
│                    │                  │                  │                  │
│                    └──────────────────┼──────────────────┘                  │
│                                       │                                      │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │  Object Storage │                             │
│                              │  (S3/R2/MinIO)  │                             │
│                              └────────┬────────┘                             │
│                                       │                                      │
│                                       ▼                                      │
│                              ┌─────────────────┐                             │
│                              │      CDN        │                             │
│                              │  (CloudFlare)   │                             │
│                              └─────────────────┘                             │
│                                                                              │
│  BUCKET STRUCTURE:                                                           │
│  ─────────────────                                                           │
│  event-platform-assets/                                                      │
│  ├── events/                                                                 │
│  │   └── {event_id}/                                                        │
│  │       ├── teams/                                                         │
│  │       │   └── {team_id}/                                                 │
│  │       │       ├── avatar.{ext}                                           │
│  │       │       ├── tearsheet.pdf                                          │
│  │       │       └── members/                                               │
│  │       │           └── {member_id}.{ext}                                  │
│  │       ├── profiles/                                                      │
│  │       │   └── {profile_id}.{ext}                                         │
│  │       ├── stages/                                                        │
│  │       │   └── {stage_id}/                                                │
│  │       │       ├── background.{ext}                                       │
│  │       │       └── assets/                                                │
│  │       │           └── {asset_id}.{ext}                                   │
│  │       └── logos/                                                         │
│  │           └── {logo_name}.{ext}                                          │
│  └── system/                                                                 │
│      └── default-assets/                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Upload Service Implementation

```typescript
// src/backend/services/upload.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
  eventId: string;
  category: 'teams' | 'profiles' | 'stages' | 'logos';
  entityId?: string;
  subcategory?: string;
}

interface ProcessedImage {
  original: string;
  thumbnail?: string;
  medium?: string;
}

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket: string;
  private cdnUrl: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.S3_BUCKET!;
    this.cdnUrl = process.env.CDN_URL!;
  }

  // Allowed file types
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

  async uploadImage(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<ProcessedImage> {
    // Validate
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image type. Allowed: JPEG, PNG, WebP');
    }
    if (file.size > this.MAX_IMAGE_SIZE) {
      throw new BadRequestException('Image too large. Max: 10MB');
    }

    const fileId = uuidv4();
    const ext = path.extname(file.originalname) || '.jpg';
    const basePath = this.buildPath(options, fileId);

    // Process and upload variants
    const results: ProcessedImage = {
      original: '',
    };

    // Original (optimized)
    const optimizedBuffer = await sharp(file.buffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    results.original = await this.uploadToS3(
      optimizedBuffer,
      `${basePath}/original${ext}`,
      'image/jpeg',
    );

    // Thumbnail (for cards)
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    results.thumbnail = await this.uploadToS3(
      thumbnailBuffer,
      `${basePath}/thumbnail${ext}`,
      'image/jpeg',
    );

    // Medium (for detail views)
    const mediumBuffer = await sharp(file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    results.medium = await this.uploadToS3(
      mediumBuffer,
      `${basePath}/medium${ext}`,
      'image/jpeg',
    );

    return results;
  }

  async uploadDocument(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<string> {
    if (!this.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid document type. Allowed: PDF');
    }
    if (file.size > this.MAX_DOCUMENT_SIZE) {
      throw new BadRequestException('Document too large. Max: 50MB');
    }

    const fileId = uuidv4();
    const ext = path.extname(file.originalname) || '.pdf';
    const filePath = `${this.buildPath(options, fileId)}${ext}`;

    return this.uploadToS3(file.buffer, filePath, file.mimetype);
  }

  private buildPath(options: UploadOptions, fileId: string): string {
    const parts = ['events', options.eventId, options.category];

    if (options.entityId) {
      parts.push(options.entityId);
    }
    if (options.subcategory) {
      parts.push(options.subcategory);
    }
    parts.push(fileId);

    return parts.join('/');
  }

  private async uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      }),
    );

    return `${this.cdnUrl}/${key}`;
  }

  async deleteFile(url: string): Promise<void> {
    const key = url.replace(`${this.cdnUrl}/`, '');

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  // Generate presigned URL for direct client upload (large files)
  async getPresignedUploadUrl(
    options: UploadOptions,
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    const fileId = uuidv4();
    const ext = path.extname(filename);
    const key = `${this.buildPath(options, fileId)}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    return {
      uploadUrl,
      publicUrl: `${this.cdnUrl}/${key}`,
    };
  }
}
```

---

## 10. Deployment Architecture

### 10.1 Production Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRODUCTION DEPLOYMENT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              INTERNET                                        │
│                                  │                                           │
│                                  ▼                                           │
│                         ┌────────────────┐                                   │
│                         │   CloudFlare   │                                   │
│                         │  (DNS + CDN +  │                                   │
│                         │   DDoS Prot.)  │                                   │
│                         └───────┬────────┘                                   │
│                                 │                                            │
│            ┌────────────────────┼────────────────────┐                      │
│            │                    │                    │                      │
│            ▼                    ▼                    ▼                      │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                │
│    │  Static CDN  │    │  API Traffic │    │  WebSocket   │                │
│    │   (assets)   │    │              │    │   Traffic    │                │
│    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                │
│           │                   │                   │                         │
│           ▼                   └─────────┬─────────┘                         │
│    ┌──────────────┐                     │                                   │
│    │     S3 /     │                     ▼                                   │
│    │ CloudFlare   │           ┌─────────────────┐                          │
│    │     R2       │           │  Load Balancer  │                          │
│    └──────────────┘           │  (nginx / ALB)  │                          │
│                               └────────┬────────┘                          │
│                                        │                                    │
│         ┌──────────────────────────────┼──────────────────────────────┐    │
│         │              KUBERNETES CLUSTER                              │    │
│         │                              │                               │    │
│         │    ┌─────────────────────────┼─────────────────────────┐    │    │
│         │    │                         │                         │    │    │
│         │    ▼                         ▼                         ▼    │    │
│         │  ┌─────────┐           ┌─────────┐           ┌─────────┐   │    │
│         │  │  API    │           │  API    │           │  API    │   │    │
│         │  │ Pod 1   │           │ Pod 2   │           │ Pod 3   │   │    │
│         │  │         │           │         │           │         │   │    │
│         │  │ ┌─────┐ │           │ ┌─────┐ │           │ ┌─────┐ │   │    │
│         │  │ │REST │ │           │ │REST │ │           │ │REST │ │   │    │
│         │  │ └─────┘ │           │ └─────┘ │           │ └─────┘ │   │    │
│         │  │ ┌─────┐ │           │ ┌─────┐ │           │ ┌─────┐ │   │    │
│         │  │ │ WS  │ │           │ │ WS  │ │           │ │ WS  │ │   │    │
│         │  │ └─────┘ │           │ └─────┘ │           │ └─────┘ │   │    │
│         │  └────┬────┘           └────┬────┘           └────┬────┘   │    │
│         │       │                     │                     │        │    │
│         │       └─────────────────────┼─────────────────────┘        │    │
│         │                             │                              │    │
│         │              ┌──────────────┴──────────────┐               │    │
│         │              │                             │               │    │
│         │              ▼                             ▼               │    │
│         │       ┌─────────────┐             ┌─────────────┐          │    │
│         │       │   Redis     │             │ PostgreSQL  │          │    │
│         │       │  Cluster    │             │  (Primary)  │          │    │
│         │       │             │             │             │          │    │
│         │       │ ┌─────────┐ │             │ ┌─────────┐ │          │    │
│         │       │ │ Master  │ │             │ │ Primary │ │          │    │
│         │       │ └─────────┘ │             │ └─────────┘ │          │    │
│         │       │ ┌─────────┐ │             │ ┌─────────┐ │          │    │
│         │       │ │Replica 1│ │             │ │ Standby │ │          │    │
│         │       │ └─────────┘ │             │ └─────────┘ │          │    │
│         │       │ ┌─────────┐ │             └─────────────┘          │    │
│         │       │ │Replica 2│ │                                      │    │
│         │       │ └─────────┘ │                                      │    │
│         │       └─────────────┘                                      │    │
│         │                                                            │    │
│         └────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Docker Compose (Development/Staging)

```yaml
# docker-compose.yml

version: '3.8'

services:
  # API Server
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/event_platform
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - S3_BUCKET=${S3_BUCKET}
      - CDN_URL=${CDN_URL}
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run start:dev

  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=event_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Admin Panel Frontend
  admin:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - APP=admin
    ports:
      - "3001:80"
    environment:
      - VITE_API_URL=http://localhost:3000/api/v1
      - VITE_WS_URL=ws://localhost:3000

  # Operator Panel Frontend
  operator:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - APP=operator
    ports:
      - "3002:80"
    environment:
      - VITE_API_URL=http://localhost:3000/api/v1
      - VITE_WS_URL=ws://localhost:3000

  # Audience Screen Frontend
  audience:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - APP=audience
    ports:
      - "3003:80"
    environment:
      - VITE_API_URL=http://localhost:3000/api/v1
      - VITE_WS_URL=ws://localhost:3000

  # Jury UI Frontend
  jury:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - APP=jury
    ports:
      - "3004:80"
    environment:
      - VITE_API_URL=http://localhost:3000/api/v1
      - VITE_WS_URL=ws://localhost:3000

  # MinIO (S3-compatible storage for local development)
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 10.3 Kubernetes Deployment (Production)

```yaml
# k8s/api-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: event-platform-api
  labels:
    app: event-platform-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: event-platform-api
  template:
    metadata:
      labels:
        app: event-platform-api
    spec:
      containers:
        - name: api
          image: event-platform/api:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: event-platform-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: event-platform-secrets
                  key: redis-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: event-platform-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: event-platform-api
spec:
  selector:
    app: event-platform-api
  ports:
    - name: http
      port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: event-platform-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/websocket-services: "event-platform-api"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  tls:
    - hosts:
        - api.eventplatform.com
      secretName: event-platform-tls
  rules:
    - host: api.eventplatform.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: event-platform-api
                port:
                  number: 80
```

### 10.4 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    strategy:
      matrix:
        app: [api, admin, operator, audience, jury]

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.app }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ${{ matrix.app == 'api' && './backend' || './frontend' }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            APP=${{ matrix.app }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG }}

      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/
          kubectl rollout restart deployment/event-platform-api
          kubectl rollout status deployment/event-platform-api

      - name: Run database migrations
        run: |
          kubectl exec deployment/event-platform-api -- npx prisma migrate deploy
```

---

## 11. Performance & Reliability Considerations

### 11.1 Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PERFORMANCE OPTIMIZATIONS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND                                                                    │
│  ─────────                                                                   │
│  • Code splitting by route (each app is separate build)                     │
│  • Lazy loading of heavy components (animations, charts)                    │
│  • Image optimization: WebP format, responsive sizes, lazy loading          │
│  • Asset preloading for critical animations                                 │
│  • Service Worker for offline capability (Jury UI)                          │
│  • Virtual scrolling for large lists (team grid)                            │
│  • Memoization of expensive renders (React.memo, useMemo)                   │
│                                                                              │
│  BACKEND                                                                     │
│  ────────                                                                    │
│  • Redis caching for live state (sub-ms reads)                              │
│  • Database connection pooling (PgBouncer or Prisma pool)                   │
│  • Query optimization with proper indexes                                   │
│  • Denormalized data for hot paths                                          │
│  • Async/non-blocking database writes for non-critical updates              │
│  • Rate limiting on public endpoints                                        │
│                                                                              │
│  NETWORK                                                                     │
│  ────────                                                                    │
│  • CDN for all static assets                                                │
│  • Gzip/Brotli compression                                                  │
│  • HTTP/2 multiplexing                                                      │
│  • WebSocket connection pooling                                             │
│  • Sticky sessions for WebSocket (or Redis adapter)                         │
│                                                                              │
│  DATABASE INDEXES                                                            │
│  ─────────────────                                                           │
│  • teams(event_id, round_assignment) - for round queries                    │
│  • teams(event_id, status) - for status filtering                           │
│  • team_scores(team_id, jury_id) - unique constraint + lookups              │
│  • event_stages(event_id, order_index) - for ordered stage retrieval        │
│  • person_profiles(event_id, profile_type) - for role-based queries         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Reliability & Error Handling

```typescript
// src/backend/common/error-handling.ts

// Global exception filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: Logger,
    private readonly sentry: SentryService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message;
      code = (exceptionResponse as any).code || 'HTTP_ERROR';
    }

    // Log error
    this.logger.error({
      message: exception instanceof Error ? exception.message : 'Unknown error',
      stack: exception instanceof Error ? exception.stack : undefined,
      path: request.url,
      method: request.method,
      status,
    });

    // Report to Sentry for 5xx errors
    if (status >= 500) {
      this.sentry.captureException(exception, {
        extra: {
          path: request.url,
          method: request.method,
          body: request.body,
        },
      });
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}

// WebSocket error handling
@Catch()
export class WsExceptionFilter implements WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    
    let error = {
      code: 'WS_ERROR',
      message: 'WebSocket error',
    };

    if (exception instanceof WsException) {
      error = exception.getError() as any;
    }

    client.emit('error', error);
  }
}

// Retry mechanism for critical operations
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        onRetry?.(lastError, attempt);
        await sleep(delay * Math.pow(backoff, attempt - 1));
      }
    }
  }

  throw lastError!;
}

// Circuit breaker for external services
class CircuitBreaker {
  private failures = 0;
  private lastFailure: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeout: number = 30000,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

### 11.3 Monitoring & Observability

```typescript
// src/backend/monitoring/metrics.ts

import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  // Counters
  readonly httpRequestsTotal: Counter;
  readonly wsConnectionsTotal: Counter;
  readonly scoreSubmissionsTotal: Counter;

  // Histograms
  readonly httpRequestDuration: Histogram;
  readonly wsMessageLatency: Histogram;

  // Gauges
  readonly activeWsConnections: Gauge;
  readonly activeEvents: Gauge;
  readonly timerState: Gauge;

  constructor() {
    this.registry = new Registry();

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.wsConnectionsTotal = new Counter({
      name: 'ws_connections_total',
      help: 'Total WebSocket connections',
      labelNames: ['event_id', 'client_type'],
      registers: [this.registry],
    });

    this.scoreSubmissionsTotal = new Counter({
      name: 'score_submissions_total',
      help: 'Total score submissions',
      labelNames: ['event_id'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    this.wsMessageLatency = new Histogram({
      name: 'ws_message_latency_seconds',
      help: 'WebSocket message latency',
      labelNames: ['event_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
      registers: [this.registry],
    });

    this.activeWsConnections = new Gauge({
      name: 'active_ws_connections',
      help: 'Current active WebSocket connections',
      labelNames: ['event_id'],
      registers: [this.registry],
    });

    this.activeEvents = new Gauge({
      name: 'active_events',
      help: 'Number of events currently live',
      registers: [this.registry],
    });
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

---

## 12. Development Phases

### 12.1 Phase Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPMENT PHASES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: Foundation (2-3 weeks)                                            │
│  ─────────────────────────────────                                           │
│  □ Project setup (monorepo, CI/CD, Docker)                                  │
│  □ Database schema & Prisma setup                                           │
│  □ Basic authentication (admin, jury codes)                                 │
│  □ Core API endpoints (CRUD for events, teams, profiles)                    │
│  □ File upload service                                                      │
│  □ Admin Panel: Event & team management screens                             │
│                                                                              │
│  PHASE 2: Live State Infrastructure (2 weeks)                               │
│  ─────────────────────────────────────────────                               │
│  □ Redis integration for live state                                         │
│  □ WebSocket server setup (Socket.IO)                                       │
│  □ Live state service (stage, team, timer management)                       │
│  □ Real-time sync between backend and clients                               │
│  □ Timer synchronization logic                                              │
│                                                                              │
│  PHASE 3: Operator Control Panel (2 weeks)                                  │
│  ─────────────────────────────────────────────                               │
│  □ Control panel UI layout                                                  │
│  □ Stage navigation & selection                                             │
│  □ Team randomization controls                                              │
│  □ Timer controls (start, pause, reset)                                     │
│  □ Animation trigger buttons                                                │
│  □ Real-time status indicators                                              │
│                                                                              │
│  PHASE 4: Audience Screen (2-3 weeks)                                       │
│  ────────────────────────────────────                                        │
│  □ Screen router based on stage type                                        │
│  □ Lobby screen with animations                                             │
│  □ Team card grid (FIFA-style)                                              │
│  □ Welcome & host display                                                   │
│  □ Jury reveal animation                                                    │
│  □ Pitching round screens (progress bar, team details, timer)               │
│  □ Break screens with countdown                                             │
│  □ Keynote speaker display                                                  │
│  □ Awards ceremony with podium reveals                                      │
│  □ Networking screen                                                        │
│                                                                              │
│  PHASE 5: Jury Scoring System (1-2 weeks)                                   │
│  ─────────────────────────────────────────                                   │
│  □ Jury login flow (access codes)                                           │
│  □ Team list with scoring status                                            │
│  □ Scoring form UI                                                          │
│  □ Real-time current team sync                                              │
│  □ Score submission & validation                                            │
│  □ Score aggregation & ranking calculation                                  │
│  □ Results lock mechanism                                                   │
│                                                                              │
│  PHASE 6: Animations & Polish (1-2 weeks)                                   │
│  ─────────────────────────────────────────                                   │
│  □ FIFA-style card reveal animations                                        │
│  □ Team shuffle animation                                                   │
│  □ Podium reveal sequence                                                   │
│  □ Timer visual effects (warnings, completion)                              │
│  □ Sound effects integration                                                │
│  □ Responsive design refinements                                            │
│  □ Performance optimization                                                 │
│                                                                              │
│  PHASE 7: Testing & Deployment (1-2 weeks)                                  │
│  ─────────────────────────────────────────                                   │
│  □ End-to-end testing                                                       │
│  □ Load testing for concurrent connections                                  │
│  □ Security audit                                                           │
│  □ Production deployment                                                    │
│  □ Documentation                                                            │
│  □ Dry run / rehearsal support                                              │
│                                                                              │
│  TOTAL ESTIMATED: 11-15 weeks                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
## 12. Development Phases (Continued)

### 12.2 MVP Feature Prioritization (Continued)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MVP vs NICE-TO-HAVE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MVP (Must Have for Event)                                                   │
│  ─────────────────────────                                                   │
│  ✓ Admin: Create/edit events, teams, jury, stages                           │
│  ✓ Admin: Upload team photos and assets                                     │
│  ✓ Operator: Stage navigation                                               │
│  ✓ Operator: Team selection and randomization                               │
│  ✓ Operator: Timer controls (presentation + Q&A + break)                    │
│  ✓ Audience: All stage screens (basic styling)                              │
│  ✓ Audience: Team card display                                              │
│  ✓ Audience: Timer display with warnings                                    │
│  ✓ Audience: Progress bar for rounds                                        │
│  ✓ Jury: Login with access code                                             │
│  ✓ Jury: View teams and submit scores                                       │
│  ✓ Jury: Current team sync                                                  │
│  ✓ Awards: Basic podium display with reveals                                │
│  ✓ Real-time sync across all clients                                        │
│                                                                              │
│  NICE-TO-HAVE (Post-MVP / Future Iterations)                                │
│  ───────────────────────────────────────────                                 │
│  ○ Admin: CSV/bulk import for teams                                         │
│  ○ Admin: Template cloning for recurring events                             │
│  ○ Admin: Drag-and-drop timeline editor                                     │
│  ○ Operator: Mini preview of audience screen                                │
│  ○ Operator: Keyboard shortcuts for faster control                          │
│  ○ Operator: Emergency "blank screen" button                                │
│  ○ Audience: Advanced FIFA-style pack opening animations                    │
│  ○ Audience: Particle effects on reveals                                    │
│  ○ Audience: Auto-pan/zoom on card grid                                     │
│  ○ Audience: Sound effects (buzzer, reveal, victory)                        │
│  ○ Audience: Background music integration                                   │
│  ○ Jury: Offline mode with sync on reconnect                                │
│  ○ Jury: Score editing before lock                                          │
│  ○ Jury: Notes/comments per team                                            │
│  ○ Awards: Confetti animation on winner reveal                              │
│  ○ Awards: Social media share cards generation                              │
│  ○ Analytics: Post-event report generation                                  │
│  ○ Analytics: Scoring breakdown visualization                               │
│  ○ Multi-language support                                                   │
│  ○ Dark/light theme toggle                                                  │
│  ○ Mobile app for jury (React Native)                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.3 Technical Milestones & Deliverables

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TECHNICAL MILESTONES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MILESTONE 1: "Hello World" (End of Week 1)                                 │
│  ──────────────────────────────────────────                                  │
│  Deliverables:                                                               │
│  • Monorepo structure with all apps scaffolded                              │
│  • Docker Compose running locally                                            │
│  • Database connected with initial schema                                    │
│  • Basic API responding to health checks                                     │
│  • CI pipeline running tests                                                 │
│                                                                              │
│  Demo: API returns event list (empty), frontend loads                        │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  MILESTONE 2: "Admin Can Configure" (End of Week 3)                         │
│  ──────────────────────────────────────────────────                          │
│  Deliverables:                                                               │
│  • Admin authentication working                                              │
│  • Full CRUD for events, teams, profiles, stages                            │
│  • File upload for images/documents                                          │
│  • Admin Panel UI for all configuration                                      │
│                                                                              │
│  Demo: Admin creates complete event with 15 teams, jury, timeline            │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  MILESTONE 3: "Real-Time Works" (End of Week 5)                             │
│  ──────────────────────────────────────────────                              │
│  Deliverables:                                                               │
│  • WebSocket server operational                                              │
│  • Redis live state management                                               │
│  • Operator can change stages, see updates on audience screen               │
│  • Timer sync working across clients                                         │
│                                                                              │
│  Demo: Operator changes stage, 3 audience screens update instantly           │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  MILESTONE 4: "Full Round Flow" (End of Week 8)                             │
│  ──────────────────────────────────────────────                              │
│  Deliverables:                                                               │
│  • Complete operator control panel                                           │
│  • All audience screen types implemented                                     │
│  • Team randomization working                                                │
│  • Presentation flow (select team → timer → next team)                      │
│  • Progress tracking                                                         │
│                                                                              │
│  Demo: Run through complete Round 1 with 5 teams                             │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  MILESTONE 5: "Jury Scores & Awards" (End of Week 10)                       │
│  ────────────────────────────────────────────────────                        │
│  Deliverables:                                                               │
│  • Jury authentication and UI                                                │
│  • Score submission working                                                  │
│  • Score aggregation and ranking                                             │
│  • Awards ceremony with podium reveals                                       │
│  • Results lock mechanism                                                    │
│                                                                              │
│  Demo: Full event dry run from welcome to awards                             │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  MILESTONE 6: "Production Ready" (End of Week 12)                           │
│  ────────────────────────────────────────────────                            │
│  Deliverables:                                                               │
│  • All animations polished                                                   │
│  • Performance optimized                                                     │
│  • Security audit complete                                                   │
│  • Production deployment done                                                │
│  • Monitoring and alerts configured                                          │
│  • Documentation complete                                                    │
│                                                                              │
│  Demo: Full dress rehearsal with stakeholders                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Scoring System Deep Dive

### 13.1 Scoring Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCORING DATA FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           ADMIN SETUP                                        │
│                               │                                              │
│                               ▼                                              │
│                    ┌─────────────────────┐                                   │
│                    │  Define Criteria    │                                   │
│                    │  ─────────────────  │                                   │
│                    │  • Investment Idea  │                                   │
│                    │    (max: 10, w: 1.0)│                                   │
│                    │  • Risk Management  │                                   │
│                    │    (max: 10, w: 1.0)│                                   │
│                    │  • Presentation     │                                   │
│                    │    (max: 10, w: 1.0)│                                   │
│                    └──────────┬──────────┘                                   │
│                               │                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                          DURING EVENT                                        │
│  ════════════════════════════════════════════════════════════════════════   │
│                               │                                              │
│            ┌──────────────────┼──────────────────┐                          │
│            │                  │                  │                          │
│            ▼                  ▼                  ▼                          │
│     ┌───────────┐      ┌───────────┐      ┌───────────┐                    │
│     │  Jury 1   │      │  Jury 2   │      │  Jury 3   │                    │
│     │  Sarah    │      │  Mark     │      │  Elena    │                    │
│     └─────┬─────┘      └─────┬─────┘      └─────┬─────┘                    │
│           │                  │                  │                          │
│           ▼                  ▼                  ▼                          │
│     ┌───────────┐      ┌───────────┐      ┌───────────┐                    │
│     │ Team A    │      │ Team A    │      │ Team A    │                    │
│     │ Inv: 8    │      │ Inv: 7    │      │ Inv: 9    │                    │
│     │ Risk: 7   │      │ Risk: 8   │      │ Risk: 7   │                    │
│     │ Pres: 9   │      │ Pres: 8   │      │ Pres: 8   │                    │
│     │ ───────── │      │ ───────── │      │ ───────── │                    │
│     │ Total: 24 │      │ Total: 23 │      │ Total: 24 │                    │
│     └─────┬─────┘      └─────┬─────┘      └─────┬─────┘                    │
│           │                  │                  │                          │
│           └──────────────────┼──────────────────┘                          │
│                              │                                              │
│                              ▼                                              │
│                    ┌─────────────────────┐                                   │
│                    │   Score Storage     │                                   │
│                    │   (PostgreSQL)      │                                   │
│                    │                     │                                   │
│                    │  team_scores table  │                                   │
│                    └──────────┬──────────┘                                   │
│                               │                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                         AWARDS CALCULATION                                   │
│  ════════════════════════════════════════════════════════════════════════   │
│                               │                                              │
│                               ▼                                              │
│                    ┌─────────────────────┐                                   │
│                    │  Aggregation        │                                   │
│                    │  ─────────────────  │                                   │
│                    │  For each team:     │                                   │
│                    │  1. Sum all jury    │                                   │
│                    │     scores          │                                   │
│                    │  2. Apply weights   │                                   │
│                    │  3. Calculate avg   │                                   │
│                    └──────────┬──────────┘                                   │
│                               │                                              │
│                               ▼                                              │
│                    ┌─────────────────────┐                                   │
│                    │  Team A Final Score │                                   │
│                    │  ─────────────────  │                                   │
│                    │  (24+23+24)/3 = 23.67│                                  │
│                    └──────────┬──────────┘                                   │
│                               │                                              │
│                               ▼                                              │
│                    ┌─────────────────────┐                                   │
│                    │      RANKING        │                                   │
│                    │  ─────────────────  │                                   │
│                    │  1. Team C: 25.33   │                                   │
│                    │  2. Team A: 23.67   │                                   │
│                    │  3. Team B: 22.00   │                                   │
│                    │  ...                │                                   │
│                    └─────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Scoring Service Implementation

```typescript
// src/backend/services/scoring.service.ts

import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EventGateway } from '../websocket/event.gateway';

interface CriteriaScore {
  criteriaId: string;
  score: number;
}

interface TeamRanking {
  teamId: string;
  teamName: string;
  university: string;
  totalScore: number;
  averageScore: number;
  juryScores: {
    juryId: string;
    juryName: string;
    criteriaScores: Record<string, number>;
    total: number;
  }[];
  rank: number;
}

interface ScoringStatus {
  teamId: string;
  teamName: string;
  juryStatuses: {
    juryId: string;
    juryName: string;
    hasScored: boolean;
    scoredAt: Date | null;
  }[];
  completionRate: number;
}

@Injectable()
export class ScoringService {
  constructor(
    private prisma: PrismaService,
    private eventGateway: EventGateway,
  ) {}

  // ============== SCORE SUBMISSION ==============

  async submitScore(
    juryId: string,
    teamId: string,
    criteriaScores: CriteriaScore[],
  ): Promise<{ score: any; totalScore: number }> {
    // Validate jury and team belong to same event
    const [jury, team] = await Promise.all([
      this.prisma.personProfile.findUnique({
        where: { id: juryId },
        include: { event: true },
      }),
      this.prisma.team.findUnique({
        where: { id: teamId },
        include: { event: true },
      }),
    ]);

    if (!jury || jury.profileType !== 'JURY') {
      throw new BadRequestException('Invalid jury member');
    }

    if (!team) {
      throw new BadRequestException('Team not found');
    }

    if (jury.eventId !== team.eventId) {
      throw new ForbiddenException('Jury and team must belong to same event');
    }

    // Check if results are locked
    const liveState = await this.prisma.liveState.findUnique({
      where: { eventId: team.eventId },
    });

    if (liveState?.roundState && (liveState.roundState as any).resultsLocked) {
      throw new ForbiddenException('Results have been locked. Scoring is closed.');
    }

    // Validate criteria
    const eventCriteria = await this.prisma.scoringCriteria.findMany({
      where: { eventId: team.eventId },
    });

    const criteriaMap = new Map(eventCriteria.map((c) => [c.id, c]));

    // Validate all criteria are scored
    const scoredCriteriaIds = new Set(criteriaScores.map((s) => s.criteriaId));
    for (const criterion of eventCriteria) {
      if (!scoredCriteriaIds.has(criterion.id)) {
        throw new BadRequestException(`Missing score for criterion: ${criterion.name}`);
      }
    }

    // Validate score ranges
    const criteriaScoresMap: Record<string, number> = {};
    for (const { criteriaId, score } of criteriaScores) {
      const criterion = criteriaMap.get(criteriaId);
      if (!criterion) {
        throw new BadRequestException(`Invalid criteria ID: ${criteriaId}`);
      }
      if (score < 1 || score > criterion.maxScore) {
        throw new BadRequestException(
          `Score for ${criterion.name} must be between 1 and ${criterion.maxScore}`,
        );
      }
      criteriaScoresMap[criteriaId] = score;
    }

    // Calculate weighted total
    let totalScore = 0;
    let totalWeight = 0;
    for (const criterion of eventCriteria) {
      const score = criteriaScoresMap[criterion.id];
      totalScore += score * criterion.weight;
      totalWeight += criterion.weight;
    }
    const weightedTotal = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Upsert score
    const savedScore = await this.prisma.teamScore.upsert({
      where: {
        teamId_juryId: { teamId, juryId },
      },
      create: {
        teamId,
        juryId,
        criteriaScores: criteriaScoresMap,
        totalScore: weightedTotal * eventCriteria.length, // Store as sum for easier aggregation
        submittedAt: new Date(),
      },
      update: {
        criteriaScores: criteriaScoresMap,
        totalScore: weightedTotal * eventCriteria.length,
        submittedAt: new Date(),
      },
    });

    // Notify operator of score submission
    this.eventGateway.broadcastStateChange(team.eventId, 'score:submitted', {
      teamId,
      juryId,
      juryName: jury.name,
      teamName: team.name,
    });

    return {
      score: savedScore,
      totalScore: weightedTotal * eventCriteria.length,
    };
  }

  // ============== SCORING STATUS ==============

  async getScoringStatus(eventId: string): Promise<ScoringStatus[]> {
    const [teams, juryMembers, scores] = await Promise.all([
      this.prisma.team.findMany({
        where: { eventId },
        orderBy: [{ roundAssignment: 'asc' }, { presentationOrder: 'asc' }],
      }),
      this.prisma.personProfile.findMany({
        where: { eventId, profileType: 'JURY' },
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.teamScore.findMany({
        where: { team: { eventId } },
      }),
    ]);

    // Create score lookup
    const scoreMap = new Map<string, Date>();
    for (const score of scores) {
      scoreMap.set(`${score.teamId}:${score.juryId}`, score.submittedAt);
    }

    // Build status for each team
    return teams.map((team) => {
      const juryStatuses = juryMembers.map((jury) => {
        const scoredAt = scoreMap.get(`${team.id}:${jury.id}`) || null;
        return {
          juryId: jury.id,
          juryName: jury.name,
          hasScored: scoredAt !== null,
          scoredAt,
        };
      });

      const scoredCount = juryStatuses.filter((s) => s.hasScored).length;

      return {
        teamId: team.id,
        teamName: team.name,
        juryStatuses,
        completionRate: juryMembers.length > 0 ? scoredCount / juryMembers.length : 0,
      };
    });
  }

  // ============== JURY'S OWN SCORES ==============

  async getJuryScores(juryId: string): Promise<{
    scores: Array<{
      teamId: string;
      teamName: string;
      roundAssignment: number;
      criteriaScores: Record<string, number>;
      totalScore: number;
      submittedAt: Date;
    }>;
    pendingTeams: Array<{
      teamId: string;
      teamName: string;
      roundAssignment: number;
    }>;
  }> {
    const jury = await this.prisma.personProfile.findUnique({
      where: { id: juryId },
    });

    if (!jury) {
      throw new BadRequestException('Jury not found');
    }

    const [teams, scores] = await Promise.all([
      this.prisma.team.findMany({
        where: { eventId: jury.eventId },
        orderBy: [{ roundAssignment: 'asc' }, { presentationOrder: 'asc' }],
      }),
      this.prisma.teamScore.findMany({
        where: { juryId },
        include: { team: true },
      }),
    ]);

    const scoredTeamIds = new Set(scores.map((s) => s.teamId));

    return {
      scores: scores.map((s) => ({
        teamId: s.teamId,
        teamName: s.team.name,
        roundAssignment: s.team.roundAssignment,
        criteriaScores: s.criteriaScores as Record<string, number>,
        totalScore: s.totalScore || 0,
        submittedAt: s.submittedAt,
      })),
      pendingTeams: teams
        .filter((t) => !scoredTeamIds.has(t.id))
        .map((t) => ({
          teamId: t.id,
          teamName: t.name,
          roundAssignment: t.roundAssignment,
        })),
    };
  }

  // ============== FINAL RANKINGS ==============

  async calculateRankings(eventId: string): Promise<TeamRanking[]> {
    const [teams, juryMembers, scores, criteria] = await Promise.all([
      this.prisma.team.findMany({
        where: { eventId },
      }),
      this.prisma.personProfile.findMany({
        where: { eventId, profileType: 'JURY' },
      }),
      this.prisma.teamScore.findMany({
        where: { team: { eventId } },
        include: { jury: true },
      }),
      this.prisma.scoringCriteria.findMany({
        where: { eventId },
      }),
    ]);

    const juryCount = juryMembers.length;

    // Group scores by team
    const teamScoresMap = new Map<string, typeof scores>();
    for (const score of scores) {
      const existing = teamScoresMap.get(score.teamId) || [];
      existing.push(score);
      teamScoresMap.set(score.teamId, existing);
    }

    // Calculate rankings
    const rankings: TeamRanking[] = teams.map((team) => {
      const teamScores = teamScoresMap.get(team.id) || [];

      const juryScores = teamScores.map((s) => ({
        juryId: s.juryId,
        juryName: s.jury.name,
        criteriaScores: s.criteriaScores as Record<string, number>,
        total: s.totalScore || 0,
      }));

      const totalScore = juryScores.reduce((sum, js) => sum + js.total, 0);
      const averageScore = juryCount > 0 ? totalScore / juryCount : 0;

      return {
        teamId: team.id,
        teamName: team.name,
        university: team.university,
        totalScore,
        averageScore,
        juryScores,
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by average score (descending)
    rankings.sort((a, b) => b.averageScore - a.averageScore);

    // Assign ranks (handling ties)
    let currentRank = 1;
    for (let i = 0; i < rankings.length; i++) {
      if (i > 0 && rankings[i].averageScore < rankings[i - 1].averageScore) {
        currentRank = i + 1;
      }
      rankings[i].rank = currentRank;
    }

    return rankings;
  }

  // ============== LOCK RESULTS ==============

  async lockResults(eventId: string): Promise<{ rankings: TeamRanking[] }> {
    // Verify all teams have been scored by all jury
    const status = await this.getScoringStatus(eventId);
    const incomplete = status.filter((s) => s.completionRate < 1);

    if (incomplete.length > 0) {
      throw new BadRequestException(
        `Cannot lock results. ${incomplete.length} teams have incomplete scoring.`,
      );
    }

    // Calculate final rankings
    const rankings = await this.calculateRankings(eventId);

    // Lock all scores
    await this.prisma.teamScore.updateMany({
      where: { team: { eventId } },
      data: { isLocked: true },
    });

    // Update live state
    await this.prisma.liveState.update({
      where: { eventId },
      data: {
        roundState: {
          resultsLocked: true,
          lockedAt: new Date().toISOString(),
          finalRankings: rankings.map((r) => ({
            rank: r.rank,
            teamId: r.teamId,
            averageScore: r.averageScore,
          })),
        },
      },
    });

    return { rankings };
  }

  // ============== GET WINNERS FOR AWARDS ==============

  async getWinners(eventId: string): Promise<{
    first: TeamRanking | null;
    second: TeamRanking | null;
    third: TeamRanking | null;
  }> {
    const rankings = await this.calculateRankings(eventId);

    return {
      first: rankings.find((r) => r.rank === 1) || null,
      second: rankings.find((r) => r.rank === 2) || null,
      third: rankings.find((r) => r.rank === 3) || null,
    };
  }
}
```

### 13.3 Jury Scoring UI Components

```typescript
// src/frontend/apps/jury/components/ScoringForm.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useScoring } from '../hooks/useScoring';

interface ScoringFormProps {
  team: {
    id: string;
    name: string;
    university: string;
    strategyTagline: string;
    stats: {
      performance: number;
      sharpe: number;
      sortino: number;
    };
  };
  criteria: Array<{
    id: string;
    name: string;
    description: string;
    maxScore: number;
  }>;
  existingScores?: Record<string, number>;
  onSubmit: (scores: Record<string, number>) => Promise<void>;
  isLocked?: boolean;
}

export const ScoringForm: React.FC<ScoringFormProps> = ({
  team,
  criteria,
  existingScores,
  onSubmit,
  isLocked,
}) => {
  const [scores, setScores] = useState<Record<string, number>>(
    existingScores || {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores((prev) => ({ ...prev, [criteriaId]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Validate all criteria are scored
    const missingCriteria = criteria.filter((c) => !scores[c.id]);
    if (missingCriteria.length > 0) {
      setError(`Please score all criteria: ${missingCriteria.map((c) => c.name).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(scores);
    } catch (err: any) {
      setError(err.message || 'Failed to submit scores');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalScore = Object.values(scores).reduce((sum, s) => sum + (s || 0), 0);
  const maxTotal = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      {/* Team Header */}
      <div className="mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
        <p className="text-gray-600">{team.university}</p>
        {team.strategyTagline && (
          <p className="text-sm text-indigo-600 mt-1 italic">
            "{team.strategyTagline}"
          </p>
        )}
        
        {/* Quick Stats */}
        <div className="flex gap-4 mt-3">
          <StatBadge label="Return" value={`${team.stats.performance}%`} />
          <StatBadge label="Sharpe" value={team.stats.sharpe.toFixed(2)} />
          <StatBadge label="Sortino" value={team.stats.sortino.toFixed(2)} />
        </div>
      </div>

      {/* Scoring Criteria */}
      <div className="space-y-6">
        {criteria.map((criterion) => (
          <div key={criterion.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-medium text-gray-900">
                {criterion.name}
              </label>
              <span className="text-lg font-bold text-indigo-600">
                {scores[criterion.id] || '-'} / {criterion.maxScore}
              </span>
            </div>
            
            {criterion.description && (
              <p className="text-sm text-gray-500">{criterion.description}</p>
            )}
            
            {/* Score Selector */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: criterion.maxScore }, (_, i) => i + 1).map(
                (value) => (
                  <motion.button
                    key={value}
                    type="button"
                    disabled={isLocked}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleScoreChange(criterion.id, value)}
                    className={`
                      w-10 h-10 rounded-lg font-bold text-lg
                      transition-all duration-200
                      ${
                        scores[criterion.id] === value
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                      ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {value}
                  </motion.button>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total Score */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center text-lg">
          <span className="font-medium">Total Score</span>
          <span className="text-2xl font-bold text-indigo-600">
            {totalScore} / {maxTotal}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="button"
        disabled={isSubmitting || isLocked}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        className={`
          mt-6 w-full py-4 rounded-xl font-bold text-lg
          transition-all duration-200
          ${
            isLocked
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isSubmitting
              ? 'bg-indigo-400 text-white cursor-wait'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {isLocked
          ? 'Scoring Locked'
          : isSubmitting
          ? 'Submitting...'
          : existingScores
          ? 'Update Score'
          : 'Submit Score'}
      </motion.button>
    </div>
  );
};

const StatBadge: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
    <span className="text-gray-500">{label}:</span>{' '}
    <span className="font-semibold">{value}</span>
  </div>
);
```

---

## 14. Animation Specifications

### 14.1 Animation Library Structure

```typescript
// src/shared/components/animations/index.ts

// Animation presets for consistent motion
export const animationPresets = {
  // Card entrance
  cardEnter: {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: -20 },
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },

  // Card flip (for reveals)
  cardFlip: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },

  // Zoom in (for focus)
  zoomIn: {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },

  // Slide up (for content reveals)
  slideUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },

  // Glow pulse (for highlights)
  glowPulse: {
    animate: {
      boxShadow: [
        '0 0 20px rgba(99, 102, 241, 0.3)',
        '0 0 40px rgba(99, 102, 241, 0.6)',
        '0 0 20px rgba(99, 102, 241, 0.3)',
      ],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
```

### 14.2 FIFA-Style Pack Opening Animation

```typescript
// src/shared/components/animations/PackOpeningReveal.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PackOpeningRevealProps {
  profile: {
    id: string;
    name: string;
    role: string;
    company: string;
    photoUrl: string;
  };
  isTriggered: boolean;
  onComplete?: () => void;
  variant?: 'jury' | 'winner';
}

export const PackOpeningReveal: React.FC<PackOpeningRevealProps> = ({
  profile,
  isTriggered,
  onComplete,
  variant = 'jury',
}) => {
  const [phase, setPhase] = useState<'hidden' | 'glow' | 'flip' | 'revealed'>('hidden');

  useEffect(() => {
    if (isTriggered) {
      // Phase 1: Glow buildup
      setPhase('glow');
      
      // Phase 2: Card flip
      const flipTimer = setTimeout(() => setPhase('flip'), 800);
      
      // Phase 3: Fully revealed
      const revealTimer = setTimeout(() => {
        setPhase('revealed');
        onComplete?.();
      }, 1600);

      return () => {
        clearTimeout(flipTimer);
        clearTimeout(revealTimer);
      };
    }
  }, [isTriggered, onComplete]);

  const cardColors = {
    jury: {
      gradient: 'from-amber-400 via-yellow-500 to-amber-600',
      glow: 'rgba(251, 191, 36, 0.6)',
    },
    winner: {
      gradient: 'from-purple-500 via-pink-500 to-red-500',
      glow: 'rgba(168, 85, 247, 0.6)',
    },
  };

  const colors = cardColors[variant];

  return (
    <div className="relative w-80 h-[420px] perspective-1000">
      <AnimatePresence mode="wait">
        {/* Hidden State - Mystery Card */}
        {phase === 'hidden' && (
          <motion.div
            key="hidden"
            className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-2xl shadow-2xl overflow-hidden`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                className="text-8xl text-white/80"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ?
              </motion.span>
            </div>
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}

        {/* Glow Phase */}
        {phase === 'glow' && (
          <motion.div
            key="glow"
            className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-2xl`}
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                `0 0 30px ${colors.glow}`,
                `0 0 80px ${colors.glow}`,
                `0 0 120px ${colors.glow}`,
              ],
            }}
            transition={{ duration: 0.8 }}
          >
            {/* Particle burst effect */}
            <ParticleBurst color={colors.glow} />
          </motion.div>
        )}

        {/* Flip Phase */}
        {phase === 'flip' && (
          <motion.div
            key="flip"
            className="absolute inset-0"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: 180 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front (mystery) */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-2xl backface-hidden`}
            />
            
            {/* Back (revealed card) */}
            <div
              className="absolute inset-0 bg-white rounded-2xl backface-hidden shadow-2xl"
              style={{ transform: 'rotateY(180deg)' }}
            >
              <ProfileCardContent profile={profile} />
            </div>
          </motion.div>
        )}

        {/* Revealed Phase */}
        {phase === 'revealed' && (
          <motion.div
            key="revealed"
            className="absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <ProfileCardContent profile={profile} />
            
            {/* Victory sparkles */}
            <VictorySparkles />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Profile card content
const ProfileCardContent: React.FC<{ profile: any }> = ({ profile }) => (
  <div className="h-full flex flex-col">
    {/* Photo */}
    <div className="relative h-60 overflow-hidden">
      <img
        src={profile.photoUrl}
        alt={profile.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
    
    {/* Info */}
    <div className="flex-1 p-6 flex flex-col justify-center">
      <motion.h3
        className="text-2xl font-bold text-gray-900"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {profile.name}
      </motion.h3>
      <motion.p
        className="text-indigo-600 font-medium mt-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {profile.role}
      </motion.p>
      <motion.p
        className="text-gray-500 mt-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {profile.company}
      </motion.p>
    </div>
  </div>
);

// Particle burst effect
const ParticleBurst: React.FC<{ color: string }> = ({ color }) => {
  const particles = Array.from({ length: 20 });
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: color,
            left: '50%',
            top: '50%',
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 300,
            y: (Math.random() - 0.5) * 300,
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 0.8,
            delay: Math.random() * 0.2,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

// Victory sparkles
const VictorySparkles: React.FC = () => {
  const sparkles = Array.from({ length: 10 });
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparkles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};
```

### 14.3 Team Shuffle Animation

```typescript
// src/shared/components/animations/TeamShuffleAnimation.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Team {
  id: string;
  name: string;
  university: string;
  avatarUrl?: string;
}

interface TeamShuffleAnimationProps {
  teams: Team[];
  isShuffling: boolean;
  finalOrder: string[]; // Team IDs in final order
  onComplete?: () => void;
}

export const TeamShuffleAnimation: React.FC<TeamShuffleAnimationProps> = ({
  teams,
  isShuffling,
  finalOrder,
  onComplete,
}) => {
  const [displayOrder, setDisplayOrder] = useState<string[]>(teams.map((t) => t.id));
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'settling' | 'complete'>('idle');

  useEffect(() => {
    if (isShuffling) {
      setPhase('shuffling');
      
      // Rapid shuffling animation (shuffle display every 100ms)
      let shuffleCount = 0;
      const maxShuffles = 15;
      
      const shuffleInterval = setInterval(() => {
        shuffleCount++;
        
        // Random shuffle for visual effect
        setDisplayOrder((prev) => {
          const shuffled = [...prev];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        });
        
        if (shuffleCount >= maxShuffles) {
          clearInterval(shuffleInterval);
          
          // Settle to final order
          setPhase('settling');
          setDisplayOrder(finalOrder);
          
          setTimeout(() => {
            setPhase('complete');
            onComplete?.();
          }, 800);
        }
      }, 100);

      return () => clearInterval(shuffleInterval);
    }
  }, [isShuffling, finalOrder, onComplete]);

  // Create team lookup
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="relative">
      {/* Title */}
      <motion.h2
        className="text-3xl font-bold text-white text-center mb-8"
        animate={{
          scale: phase === 'shuffling' ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 0.3, repeat: phase === 'shuffling' ? Infinity : 0 }}
      >
        {phase === 'shuffling'
          ? 'Randomizing...'
          : phase === 'settling'
          ? 'And the order is...'
          : 'Presentation Order'}
      </motion.h2>

      {/* Cards Container */}
      <motion.div
        className="flex justify-center gap-4 flex-wrap"
        layout
      >
        <AnimatePresence mode="popLayout">
          {displayOrder.map((teamId, index) => {
            const team = teamMap.get(teamId);
            if (!team) return null;

            return (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: phase === 'shuffling' ? [1, 0.95, 1] : 1,
                  rotate: phase === 'shuffling' ? [0, -3, 3, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  layout: { type: 'spring', stiffness: 300, damping: 30 },
                  scale: { duration: 0.15 },
                }}
                className="relative"
              >
                {/* Position Number */}
                <motion.div
                  className={`
                    absolute -top-3 -left-3 w-8 h-8 rounded-full 
                    flex items-center justify-center font-bold text-white z-10
                    ${phase === 'complete' ? 'bg-indigo-600' : 'bg-gray-600'}
                  `}
                  animate={{
                    scale: phase === 'complete' ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ delay: index * 0.1 }}
                >
                  {index + 1}
                </motion.div>

                {/* Team Card */}
                <div
                  className={`
                    w-48 h-64 rounded-xl overflow-hidden shadow-lg
                    transition-all duration-300
                    ${phase === 'complete' ? 'ring-2 ring-indigo-500' : ''}
                  `}
                >
                  {/* Avatar */}
                  <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600">
                    {team.avatarUrl ? (
                      <img
                        src={team.avatarUrl}
                        alt={team.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-white font-bold">
                        {team.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-white">
                    <h3 className="font-bold text-gray-900 truncate">
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {team.university}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Shuffle Sound Effect Trigger */}
      {phase === 'shuffling' && <ShuffleSound />}
    </div>
  );
};

// Sound effect component (plays shuffle sound)
const ShuffleSound: React.FC = () => {
  useEffect(() => {
    // Play shuffle sound
    const audio = new Audio('/sounds/card-shuffle.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore autoplay errors

    return () => {
      audio.pause();
    };
  }, []);

  return null;
};
```

---

## 15. Error Recovery & Resilience

### 15.1 Client Reconnection Strategy

```typescript
// src/shared/hooks/useReconnectingSocket.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useLiveStateStore } from '../stores/liveStateStore';

interface UseReconnectingSocketOptions {
  url: string;
  eventId: string;
  clientType: 'operator' | 'audience' | 'jury';
  onReconnect?: () => void;
}

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  lastError: string | null;
}

export function useReconnectingSocket(options: UseReconnectingSocketOptions) {
  const { url, eventId, clientType, onReconnect } = options;
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempt: 0,
    lastError: null,
  });

  const { setFullState } = useLiveStateStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      query: { eventId, clientType },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      setConnectionState({
        isConnected: true,
        isReconnecting: false,
        reconnectAttempt: 0,
        lastError: null,
      });

      // Join event room
      socket.emit('join:event', { eventId });

      // Request current state to sync
      socket.emit('request:state');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isReconnecting: true,
      }));
    });

    socket.on('reconnect_attempt', (attempt) => {
      setConnectionState((prev) => ({
        ...prev,
        isReconnecting: true,
        reconnectAttempt: attempt,
      }));
    });

    socket.on('reconnect', () => {
      console.log('Socket reconnected');
      onReconnect?.();
      
      // Re-sync state after reconnection
      socket.emit('join:event', { eventId });
      socket.emit('request:state');
    });

    socket.on('reconnect_failed', () => {
      setConnectionState((prev) => ({
        ...prev,
        isReconnecting: false,
        lastError: 'Failed to reconnect after multiple attempts',
      }));
    });

    socket.on('connect_error', (error) => {
      setConnectionState((prev) => ({
        ...prev,
        lastError: error.message,
      }));
    });

    // State sync handler
    socket.on('state:update', (state) => {
      setFullState(state);
    });

    socketRef.current = socket;
  }, [url, eventId, clientType, onReconnect, setFullState]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave:event', { eventId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [eventId]);

  const forceReconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    connectionState,
    forceReconnect,
  };
}
```

### 15.2 Offline Score Queue (Jury)

```typescript
// src/frontend/apps/jury/services/offlineScoreQueue.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineScore {
  id: string;
  teamId: string;
  criteriaScores: Record<string, number>;
  timestamp: number;
  synced: boolean;
}

interface ScoreQueueDB extends DBSchema {
  pendingScores: {
    key: string;
    value: OfflineScore;
    indexes: { 'by-synced': boolean };
  };
}

class OfflineScoreQueue {
  private db: IDBPDatabase<ScoreQueueDB> | null = null;
  private syncInProgress = false;

  async init() {
    this.db = await openDB<ScoreQueueDB>('jury-scores', 1, {
      upgrade(db) {
        const store = db.createObjectStore('pendingScores', { keyPath: 'id' });
        store.createIndex('by-synced', 'synced');
      },
    });
  }

  async queueScore(teamId: string, criteriaScores: Record<string, number>) {
    if (!this.db) await this.init();

    const score: OfflineScore = {
      id: `${teamId}-${Date.now()}`,
      teamId,
      criteriaScores,
      timestamp: Date.now(),
      synced: false,
    };

    await this.db!.put('pendingScores', score);
    return score.id;
  }

  async getPendingScores(): Promise<OfflineScore[]> {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex('pendingScores', 'by-synced', false);
  }

  async markSynced(id: string) {
    if (!this.db) await this.init();
    const score = await this.db!.get('pendingScores', id);
    if (score) {
      score.synced = true;
      await this.db!.put('pendingScores', score);
    }
  }

  async syncPendingScores(
    submitFn: (teamId: string, scores: Record<string, number>) => Promise<void>,
  ) {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const pending = await this.getPendingScores();

      // Group by team (keep only latest)
      const latestByTeam = new Map<string, OfflineScore>();
      for (const score of pending) {
        const existing = latestByTeam.get(score.teamId);
        if (!existing || score.timestamp > existing.timestamp) {
          latestByTeam.set(score.teamId, score);
        }
      }

      // Submit each
      for (const [teamId, score] of latestByTeam) {
        try {
          await submitFn(teamId, score.criteriaScores);
          await this.markSynced(score.id);
        } catch (error) {
          console.error(`Failed to sync score for team ${teamId}:`, error);
          // Will retry on next sync
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async clearSynced() {
    if (!this.db) await this.init();
    const synced = await this.db!.getAllFromIndex('pendingScores', 'by-synced', true);
    for (const score of synced) {
      await this.db!.delete('pendingScores', score.id);
    }
  }
}

export const offlineScoreQueue = new OfflineScoreQueue();
```

### 15.3 Graceful Degradation States

```typescript
// src/shared/components/ConnectionStatus.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  lastError: string | null;
  onRetry?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isReconnecting,
  reconnectAttempt,
  lastError,
  onRetry,
}) => {
  // Don't show anything when connected
  if (isConnected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div
          className={`
            px-4 py-3 text-center text-white font-medium
            ${isReconnecting ? 'bg-yellow-600' : 'bg-red-600'}
          `}
        >
          {isReconnecting ? (
            <div className="flex items-center justify-center gap-2">
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span>
                Reconnecting... (attempt {reconnectAttempt})
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <span>
                Connection lost{lastError ? `: ${lastError}` : ''}
              </span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1 bg-white text-red-600 rounded font-bold text-sm hover:bg-gray-100"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
```

---

## 16. Testing Strategy

### 16.1 Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TESTING STRATEGY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────┐                                     │
│                             /   E2E    \                                     │
│                            /   Tests    \        ~10%                        │
│                           /  (Playwright) \                                  │
│                          /─────────────────\                                 │
│                         /                   \                                │
│                        /   Integration Tests \     ~20%                      │
│                       /    (API + WebSocket)  \                              │
│                      /─────────────────────────\                             │
│                     /                           \                            │
│                    /        Unit Tests           \   ~70%                    │
│                   /   (Services, Utils, Hooks)    \                          │
│                  /─────────────────────────────────\                         │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  UNIT TESTS (Jest + React Testing Library)                                  │
│  ─────────────────────────────────────────                                   │
│  • Service methods (scoring calculation, state management)                  │
│  • Utility functions (timer calculations, data transformations)             │
│  • React hooks (useLiveState, useTimer, useScoring)                         │
│  • Component rendering (isolated, with mocked dependencies)                 │
│  • State machine transitions                                                │
│                                                                              │
│  INTEGRATION TESTS (Supertest + Socket.IO Client)                           │
│  ─────────────────────────────────────────────────                           │
│  • API endpoint flows (create event → add teams → configure)               │
│  • Authentication flows (admin login, jury code validation)                 │
│  • WebSocket message flows (state changes broadcast correctly)              │
│  • Database transactions (score submission, data integrity)                 │
│  • Timer synchronization across clients                                     │
│                                                                              │
│  E2E TESTS (Playwright)                                                     │
│  ───────────────────────                                                     │
│  • Full event flow (admin setup → operator control → jury scoring)         │
│  • Multi-client scenarios (operator + audience sync)                        │
│  • Awards ceremony flow                                                     │
│  • Error recovery (reconnection, offline handling)                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 16.2 Critical Test Scenarios

```typescript
// tests/integration/websocket.test.ts

import { io, Socket } from 'socket.io-client';
import { createTestServer, createTestEvent, createTestTeams } from './helpers';

describe('WebSocket State Synchronization', () => {
  let server: any;
  let operatorSocket: Socket;
  let audienceSocket1: Socket;
  let audienceSocket2: Socket;
  let eventId: string;

  beforeAll(async () => {
    server = await createTestServer();
    eventId = await createTestEvent();
    await createTestTeams(eventId, 5);
  });

  beforeEach(async () => {
    operatorSocket = io(server.url, { query: { eventId, clientType: 'operator' } });
    audienceSocket1 = io(server.url, { query: { eventId, clientType: 'audience' } });
    audienceSocket2 = io(server.url, { query: { eventId, clientType: 'audience' } });

    await Promise.all([
      new Promise((resolve) => operatorSocket.on('connect', resolve)),
      new Promise((resolve) => audienceSocket1.on('connect', resolve)),
      new Promise((resolve) => audienceSocket2.on('connect', resolve)),
    ]);
  });

  afterEach(() => {
    operatorSocket.disconnect();
    audienceSocket1.disconnect();
    audienceSocket2.disconnect();
  });

  test('stage change broadcasts to all audience clients', async () => {
    const stageChangePromises = [
      new Promise((resolve) => audienceSocket1.on('stage:changed', resolve)),
      new Promise((resolve) => audienceSocket2.on('stage:changed', resolve)),
    ];

    // Operator changes stage via API
    await fetch(`${server.url}/api/v1/operator/events/${eventId}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId: 'stage_1' }),
    });

    const results = await Promise.all(stageChangePromises);

    expect(results[0]).toMatchObject({ stage: { id: 'stage_1' } });
    expect(results[1]).toMatchObject({ stage: { id: 'stage_1' } });
  });

  test('timer sync maintains accuracy across clients', async () => {
    const timerDuration = 10000; // 10 seconds

    // Start timer
    await fetch(`${server.url}/api/v1/operator/events/${eventId}/timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'presentation', durationSeconds: 10 }),
    });

    // Wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get timer state from both clients
    const timerStates = await Promise.all([
      new Promise((resolve) => {
        audienceSocket1.emit('request:state');
        audienceSocket1.once('state:update', (state) => resolve(state.timerState));
      }),
      new Promise((resolve) => {
        audienceSocket2.emit('request:state');
        audienceSocket2.once('state:update', (state) => resolve(state.timerState));
      }),
    ]);

    // Both should show ~8 seconds remaining (within 500ms tolerance)
    const [timer1, timer2] = timerStates as any[];
    const remaining1 = timer1.durationMs - (Date.now() - timer1.serverStartTime);
    const remaining2 = timer2.durationMs - (Date.now() - timer2.serverStartTime);

    expect(remaining1).toBeGreaterThan(7500);
    expect(remaining1).toBeLessThan(8500);
    expect(Math.abs(remaining1 - remaining2)).toBeLessThan(100); // Clients in sync
  });

  test('reconnecting client receives current state', async () => {
    // Set some state
    await fetch(`${server.url}/api/v1/operator/events/${eventId}/stage`, {
      method: 'POST',
      body: JSON.stringify({ stageId: 'stage_2' }),
    });

    // Disconnect and reconnect audience client
    audienceSocket1.disconnect();

    const newSocket = io(server.url, { query: { eventId, clientType: 'audience' } });

    const state = await new Promise((resolve) => {
      newSocket.on('state:update', resolve);
      newSocket.emit('join:event', { eventId });
    });

    expect(state).toMatchObject({
      currentStageId: 'stage_2',
    });

    newSocket.disconnect();
  });
});

// tests/integration/scoring.test.ts

describe('Scoring System', () => {
  test('scores are aggregated correctly for rankings', async () => {
    const eventId = await createTestEvent();
    const teams = await createTestTeams(eventId, 3);
    const jury = await createTestJury(eventId, 3);

    // Submit scores
    // Team 0: average 8
    await submitScore(jury[0].id, teams[0].id, { c1: 8, c2: 8, c3: 8 });
    await submitScore(jury[1].id, teams[0].id, { c1: 8, c2: 8, c3: 8 });
    await submitScore(jury[2].id, teams[0].id, { c1: 8, c2: 8, c3: 8 });

    // Team 1: average 9
    await submitScore(jury[0].id, teams[1].id, { c1: 9, c2: 9, c3: 9 });
    await submitScore(jury[1].id, teams[1].id, { c1: 9, c2: 9, c3: 9 });
    await submitScore(jury[2].id, teams[1].id, { c1: 9, c2: 9, c3: 9 });

    // Team 2: average 7
    await submitScore(jury[0].id, teams[2].id, { c1: 7, c2: 7, c3: 7 });
    await submitScore(jury[1].id, teams[2].id, { c1: 7, c2: 7, c3: 7 });
    await submitScore(jury[2].id, teams[2].id, { c1: 7, c2: 7, c3: 7 });

    // Get rankings
    const rankings = await getRankings(eventId);

    expect(rankings[0].teamId).toBe(teams[1].id); // 1st place
    expect(rankings[0].rank).toBe(1);
    expect(rankings[1].teamId).toBe(teams[0].id); // 2nd place
    expect(rankings[1].rank).toBe(2);
    expect(rankings[2].teamId).toBe(teams[2].id); // 3rd place
    expect(rankings[2].rank).toBe(3);
  });

  test('cannot submit scores after results are locked', async () => {
    const eventId = await createTestEvent();
    const teams = await createTestTeams(eventId, 1);
    const jury = await createTestJury(eventId, 1);

    // Submit initial score
    await submitScore(jury[0].id, teams[0].id, { c1: 8, c2: 8, c3: 8 });

    // Lock results
    await lockResults(eventId);

    // Try to submit another score
    const response = await submitScore(jury[0].id, teams[0].id, { c1: 10, c2: 10, c3: 10 });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('RESULTS_LOCKED');
  });
});
```

---

## 17. Documentation Requirements

### 17.1 Documentation Deliverables

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DOCUMENTATION CHECKLIST                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DEVELOPER DOCUMENTATION                                                     │
│  ───────────────────────                                                     │
│  □ README.md - Project overview, quick start                                │
│  □ ARCHITECTURE.md - This document (technical architecture)                 │
│  □ API.md - OpenAPI/Swagger documentation                                   │
│  □ WEBSOCKET.md - WebSocket events and payloads                             │
│  □ DATABASE.md - Schema documentation, migrations guide                     │
│  □ DEPLOYMENT.md - Deployment procedures, environment setup                 │
│  □ CONTRIBUTING.md - Code style, PR process                                 │
│                                                                              │
│  OPERATOR DOCUMENTATION                                                      │
│  ──────────────────────                                                      │
│  □ Operator Guide - Step-by-step event running guide                        │
│  □ Quick Reference Card - Keyboard shortcuts, common actions                │
│  □ Troubleshooting Guide - Common issues and solutions                      │
│  □ Rehearsal Checklist - Pre-event testing steps                            │
│                                                                              │
│  ADMIN DOCUMENTATION                                                         │
│  ───────────────────                                                         │
│  □ Admin Guide - Event setup walkthrough                                    │
│  □ Team Import Template - CSV format documentation                          │
│  □ Asset Guidelines - Image sizes, formats, recommendations                 │
│                                                                              │
│  JURY DOCUMENTATION                                                          │
│  ─────────────────                                                           │
│  □ Jury Quick Start - How to login and score                                │
│  □ Scoring Criteria Guide - What each criterion means                       │
│                                                                              │
│  INLINE DOCUMENTATION                                                        │
│  ────────────────────                                                        │
│  □ JSDoc comments on all service methods                                    │
│  □ TypeScript interfaces documented                                          │
│  □ Component prop documentation                                              │
│  □ WebSocket event schemas documented                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
## 18. Summary & Next Steps (Continued)

### 18.1 Architecture Summary (Continued)

| Aspect | Decision |
|--------|----------|
| **Frontend Framework** | React 18 + TypeScript |
| **Backend Framework** | NestJS |
| **Database** | PostgreSQL (primary) + Redis (cache/realtime) |
| **Real-time** | Socket.IO with Redis adapter |
| **ORM** | Prisma |
| **Authentication** | JWT (admin/operator) + Access Codes (jury) |
| **File Storage** | S3-compatible (AWS S3 / Cloudflare R2) |
| **Animations** | Framer Motion |
| **State Management** | Zustand (frontend) + Redis (backend live state) |
| **Deployment** | Docker + Kubernetes |
| **CI/CD** | GitHub Actions |

### 18.2 Key Technical Decisions Rationale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KEY TECHNICAL DECISIONS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. SEPARATE FRONTEND APPS vs SINGLE SPA                                    │
│  ─────────────────────────────────────────                                   │
│  Decision: Separate builds for Admin, Operator, Audience, Jury              │
│  Rationale:                                                                  │
│  • Different performance profiles (Audience needs fast load, minimal JS)    │
│  • Different caching strategies                                             │
│  • Independent deployment possible                                          │
│  • Smaller bundle sizes per app                                             │
│  • Security isolation (Audience has no admin code)                          │
│                                                                              │
│  2. REDIS FOR LIVE STATE vs DATABASE-ONLY                                   │
│  ─────────────────────────────────────────                                   │
│  Decision: Redis as primary live state store, PostgreSQL for persistence    │
│  Rationale:                                                                  │
│  • Sub-millisecond reads for real-time sync                                 │
│  • Pub/Sub for multi-instance broadcasting                                  │
│  • Timer state needs frequent updates (every second)                        │
│  • PostgreSQL for durability, audit trail                                   │
│  • Graceful degradation if Redis fails (fallback to DB)                     │
│                                                                              │
│  3. SOCKET.IO vs RAW WEBSOCKETS vs SSE                                      │
│  ─────────────────────────────────────────                                   │
│  Decision: Socket.IO                                                         │
│  Rationale:                                                                  │
│  • Automatic reconnection with backoff                                      │
│  • Room/namespace support for event isolation                               │
│  • Fallback to polling if WebSocket fails                                   │
│  • Built-in acknowledgments for critical messages                           │
│  • Redis adapter for horizontal scaling                                     │
│  • Large ecosystem and proven reliability                                   │
│                                                                              │
│  4. MONOREPO vs SEPARATE REPOS                                              │
│  ─────────────────────────────────────────                                   │
│  Decision: Monorepo with shared code                                         │
│  Rationale:                                                                  │
│  • Shared TypeScript types between frontend/backend                         │
│  • Atomic commits across services                                           │
│  • Easier refactoring                                                       │
│  • Single CI/CD pipeline                                                    │
│  • Shared UI components, hooks, utilities                                   │
│                                                                              │
│  5. JWT vs SESSION-BASED AUTH                                               │
│  ─────────────────────────────────────────                                   │
│  Decision: JWT with short-lived access + refresh tokens                     │
│  Rationale:                                                                  │
│  • Stateless API servers (easier scaling)                                   │
│  • Works well with WebSocket auth                                           │
│  • Jury access codes map to JWT for simplicity                              │
│  • Refresh tokens for extended sessions                                     │
│                                                                              │
│  6. STATE MACHINE FOR EVENT FLOW                                            │
│  ─────────────────────────────────────────                                   │
│  Decision: XState-inspired state machines for stages and rounds             │
│  Rationale:                                                                  │
│  • Complex event flow with many states                                      │
│  • Prevents invalid state transitions                                       │
│  • Self-documenting (state diagram = documentation)                         │
│  • Easier testing of flow logic                                             │
│  • Recoverable state after crashes                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 18.3 Risk Assessment & Mitigations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RISK ASSESSMENT                                         │
├──────────────────────┬──────────┬───────────────────────────────────────────┤
│  Risk                │ Severity │ Mitigation                                │
├──────────────────────┼──────────┼───────────────────────────────────────────┤
│  Network failure     │  HIGH    │ • Offline score queue for jury           │
│  during event        │          │ • Auto-reconnect with state sync         │
│                      │          │ • Visual connection status indicator     │
│                      │          │ • Local state caching                    │
│                      │          │ • Operator can continue without network  │
│                      │          │   (manual mode fallback)                 │
├──────────────────────┼──────────┼───────────────────────────────────────────┤
│  Timer desync        │  MEDIUM  │ • Server-authoritative timestamps        │
│  across clients      │          │ • Periodic sync broadcasts (every 1s)    │
│                      │          │ • Client-side interpolation              │
│                      │          │ • NTP sync on servers                    │
├──────────────────────┼──────────┼───────────────────────────────────────────┤
│  Operator laptop     │  HIGH    │ • State persisted in Redis/DB            │
│  crashes             │          │ • Any authenticated device can take over │
│                      │          │ • Mobile operator fallback option        │
│                      │          │ • Auto-save of current position          │
├──────────────────────┼──────────┼───────────────────────────────────────────┤
│  Database failure    │  MEDIUM  │ • Read replicas for queries              │
│                      │          │ • Redis caches hot data                  │
│                      │          │ • Event can continue from Redis state    │
│                      │          │ • Scores queued locally if needed        │
├──────────────────────┼──────────┼───────────────────────────────────────────┤
│  Redis failure       │  MEDIUM  │ • Fallback to database for state         │
│                      │          │ • Local state in operator UI             │
│                      │          │ • Degraded but functional mode           │
├──────────────────────┼──────────┼───────────────────────────────────────────┤
│  Audience screen     │  LOW     │ • Auto-refresh on connection restore     │
│  freezes             │          │ • Watchdog timer to detect stuck state   │
│                      │          │ • Manual refresh button (hidden)         │
│                      │          │ • Heartbeat monitoring                   │
├──────────────────────┼──────────┼───────────────────────────────────────────┤
│  Scoring disputes    │  MEDIUM  │ • Full audit trail in database           │
│                      │          │ • Timestamps on all submissions          │
│                      │          │ • Admin can view/export raw scores       │
│                      │          │ • Lock mechanism prevents late changes   │
├──────────────────────┼──────────┼───────────────────────────────────────────┤
│  Projector           │  LOW     │ • Audience screen is pure display        │
│  compatibility       │          │ • Tested resolutions: 1080p, 4K          │
│                      │          │ • Fallback to simple CSS if needed       │
│                      │          │ • Hardware acceleration optional         │
├──────────────────────┼──────────┼───────────────────────────────────────────┤
│  Last-minute         │  MEDIUM  │ • Admin can edit teams until event start │
│  team changes        │          │ • Re-randomization available per round   │
│                      │          │ • Quick team status toggles              │
└──────────────────────┴──────────┴───────────────────────────────────────────┘
```

### 18.4 Pre-Event Checklist (Technical)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRE-EVENT TECHNICAL CHECKLIST                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1 WEEK BEFORE                                                               │
│  ─────────────                                                               │
│  □ All team data entered and verified                                       │
│  □ All jury profiles created with access codes                              │
│  □ All stage configurations complete                                        │
│  □ All assets uploaded (logos, backgrounds, photos)                         │
│  □ Scoring criteria defined and tested                                      │
│  □ Full dry run completed with stakeholders                                 │
│  □ Backup operator trained                                                  │
│                                                                              │
│  1 DAY BEFORE                                                                │
│  ────────────                                                                │
│  □ Production deployment verified                                           │
│  □ SSL certificates valid                                                   │
│  □ Database backed up                                                       │
│  □ Redis flushed and verified                                               │
│  □ All URLs tested and accessible                                           │
│  □ Jury access codes distributed and tested                                 │
│  □ Operator laptop tested with venue WiFi (if possible)                     │
│  □ Audience screen URL tested on target device                              │
│                                                                              │
│  DAY OF EVENT (2 hours before)                                              │
│  ─────────────────────────────                                               │
│  □ Operator laptop connected and logged in                                  │
│  □ Audience screen displaying lobby                                         │
│  □ All jury members can access scoring UI                                   │
│  □ Timer functionality tested                                               │
│  □ Animation triggers tested                                                │
│  □ Sound system tested (if using buzzer sounds)                             │
│  □ Backup mobile hotspot available                                          │
│  □ Emergency contact numbers for tech support                               │
│                                                                              │
│  30 MINUTES BEFORE                                                           │
│  ─────────────────                                                           │
│  □ Event status set to LIVE                                                 │
│  □ Stage set to "Doors Open" / Lobby                                        │
│  □ Connection status green on all devices                                   │
│  □ Quick timer test (start/stop)                                            │
│  □ Operator has printed backup schedule                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 18.5 Emergency Procedures

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EMERGENCY PROCEDURES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SCENARIO: Complete Internet Failure                                         │
│  ───────────────────────────────────                                         │
│  1. Audience screen will show last state (frozen but visible)               │
│  2. Operator switches to manual mode:                                       │
│     • Use phone timer for presentations                                     │
│     • Verbal announcements for transitions                                  │
│     • Paper scoring sheets as backup                                        │
│  3. When internet restores:                                                 │
│     • Operator reconnects and syncs state                                   │
│     • Jury re-submits any pending scores                                    │
│     • Audience screen auto-recovers                                         │
│                                                                              │
│  SCENARIO: Operator Laptop Failure                                           │
│  ─────────────────────────────────                                           │
│  1. Backup operator takes over on different device                          │
│  2. Log in with same credentials                                            │
│  3. System state is preserved in cloud                                      │
│  4. Continue from current position                                          │
│                                                                              │
│  SCENARIO: Audience Screen Crashes                                           │
│  ─────────────────────────────────                                           │
│  1. Refresh browser (F5)                                                    │
│  2. If stuck, clear cache and reload                                        │
│  3. Fallback: Open URL on backup device                                     │
│  4. Screen will auto-sync to current state                                  │
│                                                                              │
│  SCENARIO: Jury Cannot Submit Scores                                         │
│  ───────────────────────────────────                                         │
│  1. Check jury member's internet connection                                 │
│  2. Try refreshing their browser                                            │
│  3. Provide backup device if available                                      │
│  4. Paper backup: Record scores manually, admin enters later                │
│  5. Scores can be entered until awards lock                                 │
│                                                                              │
│  SCENARIO: Timer Desynchronized                                              │
│  ──────────────────────────────                                              │
│  1. Operator clicks "Reset Timer"                                           │
│  2. Start timer fresh                                                       │
│  3. All clients will resync automatically                                   │
│  4. If persistent, use phone timer as visual backup                         │
│                                                                              │
│  SCENARIO: Wrong Team Displayed                                              │
│  ──────────────────────────────                                              │
│  1. Operator selects correct team from Control Panel                        │
│  2. Screen updates immediately                                              │
│  3. No data is lost                                                         │
│                                                                              │
│  SCENARIO: Scores Need Correction                                            │
│  ────────────────────────────────                                            │
│  1. Before lock: Jury can resubmit (overwrites previous)                    │
│  2. After lock: Admin must unlock, jury resubmits, re-lock                  │
│  3. Full audit trail preserved                                              │
│                                                                              │
│  EMERGENCY CONTACTS                                                          │
│  ───────────────────                                                         │
│  • Technical Lead: [Phone Number]                                           │
│  • Backup Operator: [Phone Number]                                          │
│  • Venue IT Support: [Phone Number]                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 18.6 Post-Event Data Export

```typescript
// src/backend/services/export.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportEventResults(eventId: string): Promise<Buffer> {
    const [event, teams, jury, scores, criteria] = await Promise.all([
      this.prisma.event.findUnique({ where: { id: eventId } }),
      this.prisma.team.findMany({
        where: { eventId },
        include: { members: true },
        orderBy: { presentationOrder: 'asc' },
      }),
      this.prisma.personProfile.findMany({
        where: { eventId, profileType: 'JURY' },
      }),
      this.prisma.teamScore.findMany({
        where: { team: { eventId } },
        include: { team: true, jury: true },
      }),
      this.prisma.scoringCriteria.findMany({
        where: { eventId },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Summary Rankings
    const summarySheet = workbook.addWorksheet('Final Rankings');
    summarySheet.columns = [
      { header: 'Rank', key: 'rank', width: 10 },
      { header: 'Team Name', key: 'teamName', width: 30 },
      { header: 'University', key: 'university', width: 30 },
      { header: 'Average Score', key: 'avgScore', width: 15 },
      { header: 'Total Score', key: 'totalScore', width: 15 },
    ];

    // Calculate rankings
    const teamScoreMap = new Map<string, number[]>();
    for (const score of scores) {
      const existing = teamScoreMap.get(score.teamId) || [];
      existing.push(score.totalScore || 0);
      teamScoreMap.set(score.teamId, existing);
    }

    const rankings = teams
      .map((team) => {
        const teamScores = teamScoreMap.get(team.id) || [];
        const totalScore = teamScores.reduce((a, b) => a + b, 0);
        const avgScore = teamScores.length > 0 ? totalScore / teamScores.length : 0;
        return { team, totalScore, avgScore };
      })
      .sort((a, b) => b.avgScore - a.avgScore);

    rankings.forEach((r, index) => {
      summarySheet.addRow({
        rank: index + 1,
        teamName: r.team.name,
        university: r.team.university,
        avgScore: r.avgScore.toFixed(2),
        totalScore: r.totalScore.toFixed(2),
      });
    });

    // Sheet 2: Detailed Scores
    const detailSheet = workbook.addWorksheet('Detailed Scores');
    const detailColumns = [
      { header: 'Team', key: 'team', width: 25 },
      { header: 'Jury Member', key: 'jury', width: 25 },
      ...criteria.map((c) => ({ header: c.name, key: c.id, width: 15 })),
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Submitted At', key: 'submittedAt', width: 20 },
    ];
    detailSheet.columns = detailColumns;

    for (const score of scores) {
      const row: any = {
        team: score.team.name,
        jury: score.jury.name,
        total: score.totalScore?.toFixed(2),
        submittedAt: score.submittedAt.toISOString(),
      };

      const criteriaScores = score.criteriaScores as Record<string, number>;
      for (const c of criteria) {
        row[c.id] = criteriaScores[c.id] || '-';
      }

      detailSheet.addRow(row);
    }

    // Sheet 3: Teams
    const teamsSheet = workbook.addWorksheet('Teams');
    teamsSheet.columns = [
      { header: 'Team Name', key: 'name', width: 25 },
      { header: 'University', key: 'university', width: 30 },
      { header: 'Round', key: 'round', width: 10 },
      { header: 'Presentation Order', key: 'order', width: 18 },
      { header: 'Strategy', key: 'strategy', width: 40 },
      { header: 'Members', key: 'members', width: 50 },
    ];

    for (const team of teams) {
      teamsSheet.addRow({
        name: team.name,
        university: team.university,
        round: team.roundAssignment,
        order: team.presentationOrder,
        strategy: team.strategyTagline,
        members: team.members.map((m) => m.name).join(', '),
      });
    }

    // Sheet 4: Event Info
    const infoSheet = workbook.addWorksheet('Event Info');
    infoSheet.addRow(['Event Name', event?.name]);
    infoSheet.addRow(['Date', event?.date?.toISOString()]);
    infoSheet.addRow(['Venue', event?.venue]);
    infoSheet.addRow(['Total Teams', teams.length]);
    infoSheet.addRow(['Total Jury', jury.length]);
    infoSheet.addRow(['Export Date', new Date().toISOString()]);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportAuditLog(eventId: string): Promise<any[]> {
    // Return chronological log of all scoring activity
    const scores = await this.prisma.teamScore.findMany({
      where: { team: { eventId } },
      include: { team: true, jury: true },
      orderBy: { submittedAt: 'asc' },
    });

    return scores.map((s) => ({
      timestamp: s.submittedAt,
      action: 'SCORE_SUBMITTED',
      juryId: s.juryId,
      juryName: s.jury.name,
      teamId: s.teamId,
      teamName: s.team.name,
      scores: s.criteriaScores,
      total: s.totalScore,
      locked: s.isLocked,
    }));
  }
}
```

### 18.7 Project Structure Overview

```
event-platform/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jury-code.strategy.ts
│   │   │   └── guards/
│   │   │       ├── jwt-auth.guard.ts
│   │   │       └── roles.guard.ts
│   │   ├── events/
│   │   │   ├── events.module.ts
│   │   │   ├── events.service.ts
│   │   │   ├── events.controller.ts
│   │   │   └── dto/
│   │   ├── teams/
│   │   │   ├── teams.module.ts
│   │   │   ├── teams.service.ts
│   │   │   ├── teams.controller.ts
│   │   │   └── dto/
│   │   ├── profiles/
│   │   │   ├── profiles.module.ts
│   │   │   ├── profiles.service.ts
│   │   │   └── profiles.controller.ts
│   │   ├── stages/
│   │   │   ├── stages.module.ts
│   │   │   ├── stages.service.ts
│   │   │   └── stages.controller.ts
│   │   ├── scoring/
│   │   │   ├── scoring.module.ts
│   │   │   ├── scoring.service.ts
│   │   │   └── scoring.controller.ts
│   │   ├── live-state/
│   │   │   ├── live-state.module.ts
│   │   │   ├── live-state.service.ts
│   │   │   └── timer.service.ts
│   │   ├── operator/
│   │   │   ├── operator.module.ts
│   │   │   └── operator.controller.ts
│   │   ├── websocket/
│   │   │   ├── websocket.module.ts
│   │   │   ├── event.gateway.ts
│   │   │   └── redis-pubsub.service.ts
│   │   ├── upload/
│   │   │   ├── upload.module.ts
│   │   │   ├── upload.service.ts
│   │   │   └── upload.controller.ts
│   │   ├── export/
│   │   │   ├── export.module.ts
│   │   │   ├── export.service.ts
│   │   │   └── export.controller.ts
│   │   ├── common/
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   ├── decorators/
│   │   │   └── pipes/
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── apps/
│   │   │   ├── admin/
│   │   │   │   ├── main.tsx
│   │   │   │   ├── App.tsx
│   │   │   │   ├── pages/
│   │   │   │   │   ├── Dashboard.tsx
│   │   │   │   │   ├── EventList.tsx
│   │   │   │   │   ├── EventEdit.tsx
│   │   │   │   │   ├── TeamManagement.tsx
│   │   │   │   │   ├── JuryManagement.tsx
│   │   │   │   │   ├── StageConfiguration.tsx
│   │   │   │   │   └── Settings.tsx
│   │   │   │   └── components/
│   │   │   ├── operator/
│   │   │   │   ├── main.tsx
│   │   │   │   ├── App.tsx
│   │   │   │   ├── pages/
│   │   │   │   │   └── ControlPanel.tsx
│   │   │   │   └── components/
│   │   │   │       ├── StageNavigation.tsx
│   │   │   │       ├── TeamControls.tsx
│   │   │   │       ├── TimerControls.tsx
│   │   │   │       ├── AnimationTriggers.tsx
│   │   │   │       ├── JuryScoringStatus.tsx
│   │   │   │       └── MiniPreview.tsx
│   │   │   ├── audience/
│   │   │   │   ├── main.tsx
│   │   │   │   ├── App.tsx
│   │   │   │   ├── pages/
│   │   │   │   │   └── Display.tsx
│   │   │   │   ├── screens/
│   │   │   │   │   ├── LobbyScreen.tsx
│   │   │   │   │   ├── CardGridScreen.tsx
│   │   │   │   │   ├── WelcomeScreen.tsx
│   │   │   │   │   ├── JuryRevealScreen.tsx
│   │   │   │   │   ├── PitchingRoundScreen.tsx
│   │   │   │   │   ├── BreakScreen.tsx
│   │   │   │   │   ├── KeynoteScreen.tsx
│   │   │   │   │   ├── AwardsScreen.tsx
│   │   │   │   │   └── NetworkingScreen.tsx
│   │   │   │   └── components/
│   │   │   └── jury/
│   │   │       ├── main.tsx
│   │   │       ├── App.tsx
│   │   │       ├── pages/
│   │   │       │   ├── Login.tsx
│   │   │       │   ├── TeamList.tsx
│   │   │       │   └── ScoringPage.tsx
│   │   │       └── components/
│   │   │           ├── ScoringForm.tsx
│   │   │           ├── TeamCard.tsx
│   │   │           └── CurrentTeamBanner.tsx
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── cards/
│   │   │   │   │   ├── TeamCard.tsx
│   │   │   │   │   ├── ProfileCard.tsx
│   │   │   │   │   └── StatsBadge.tsx
│   │   │   │   ├── timer/
│   │   │   │   │   ├── TimerDisplay.tsx
│   │   │   │   │   └── CountdownTimer.tsx
│   │   │   │   ├── animations/
│   │   │   │   │   ├── CardRevealAnimation.tsx
│   │   │   │   │   ├── PackOpeningReveal.tsx
│   │   │   │   │   ├── TeamShuffleAnimation.tsx
│   │   │   │   │   ├── PodiumReveal.tsx
│   │   │   │   │   └── ParticleEffects.tsx
│   │   │   │   └── layout/
│   │   │   │       ├── ConnectionStatus.tsx
│   │   │   │       └── LoadingScreen.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts
│   │   │   │   ├── useLiveState.ts
│   │   │   │   ├── useTimer.ts
│   │   │   │   ├── useApi.ts
│   │   │   │   └── useAuth.ts
│   │   │   ├── stores/
│   │   │   │   ├── liveStateStore.ts
│   │   │   │   ├── authStore.ts
│   │   │   │   └── eventDataStore.ts
│   │   │   ├── api/
│   │   │   │   ├── client.ts
│   │   │   │   ├── events.ts
│   │   │   │   ├── teams.ts
│   │   │   │   ├── scoring.ts
│   │   │   │   └── operator.ts
│   │   │   ├── types/
│   │   │   │   ├── event.ts
│   │   │   │   ├── team.ts
│   │   │   │   ├── profile.ts
│   │   │   │   ├── scoring.ts
│   │   │   │   ├── stage.ts
│   │   │   │   └── websocket.ts
│   │   │   ├── utils/
│   │   │   │   ├── formatters.ts
│   │   │   │   ├── validators.ts
│   │   │   │   └── constants.ts
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   └── assets/
│   │       ├── sounds/
│   │       │   ├── buzzer.mp3
│   │       │   ├── reveal.mp3
│   │       │   └── victory.mp3
│   │       └── images/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx/
│       └── nginx.conf
│
├── k8s/
│   ├── namespace.yaml
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   ├── frontend-deployment.yaml
│   ├── ingress.yaml
│   ├── secrets.yaml
│   └── configmap.yaml
│
├── docs/
│   ├── ARCHITECTURE.md (this document)
│   ├── API.md
│   ├── WEBSOCKET.md
│   ├── DEPLOYMENT.md
│   ├── OPERATOR_GUIDE.md
│   ├── ADMIN_GUIDE.md
│   └── JURY_GUIDE.md
│
├── scripts/
│   ├── setup-dev.sh
│   ├── seed-demo-data.ts
│   └── generate-jury-codes.ts
│
├── .env.example
├── .gitignore
├── README.md
└── package.json (workspace root)
```

### 18.8 Getting Started for Developers

```markdown
# Quick Start Guide

## Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended) or npm

## Setup

1. Clone the repository
```bash
git clone https://github.com/your-org/event-platform.git
cd event-platform
```

2. Install dependencies
```bash
pnpm install
```

3. Start infrastructure (PostgreSQL, Redis)
```bash
docker-compose up -d db redis
```

4. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your values
```

5. Run database migrations
```bash
cd backend
pnpm prisma migrate dev
pnpm prisma db seed
```

6. Start development servers
```bash
# Terminal 1: Backend
cd backend
pnpm run start:dev

# Terminal 2: Admin Frontend
cd frontend
pnpm run dev:admin

# Terminal 3: Operator Frontend
cd frontend
pnpm run dev:operator

# Terminal 4: Audience Frontend
cd frontend
pnpm run dev:audience

# Terminal 5: Jury Frontend
cd frontend
pnpm run dev:jury
```

## Access Points
- Admin Panel: http://localhost:3001
- Operator Panel: http://localhost:3002
- Audience Screen: http://localhost:3003
- Jury UI: http://localhost:3004
- API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

## Demo Credentials
- Admin: admin@example.com / password123
- Jury Code: DEMO1234
```

---

## 19. Appendix

### 19.1 WebSocket Event Reference

```typescript
// Complete WebSocket Event Reference

// ═══════════════════════════════════════════════════════════
// SERVER → CLIENT EVENTS
// ═══════════════════════════════════════════════════════════

interface ServerToClientEvents {
  // Full state synchronization
  'state:update': (state: LiveState) => void;

  // Stage changes
  'stage:changed': (payload: {
    stage: EventStage;
    previousStageId: string | null;
    timestamp: string;
  }) => void;

  // Team selection
  'team:selected': (payload: {
    team: Team;
    previousTeamId: string | null;
    roundNumber: number;
    positionInRound: number;
  }) => void;

  // Timer events
  'timer:sync': (timerState: TimerState) => void;
  'timer:warning': (payload: { secondsRemaining: number }) => void;
  'timer:completed': (payload: { type: string }) => void;

  // Animation triggers
  'animation:trigger': (payload: {
    animation: string;
    params: Record<string, any>;
  }) => void;
  'animation:step': (payload: {
    animation: string;
    step: number;
    totalSteps: number;
  }) => void;

  // Round events
  'round:started': (payload: { roundNumber: number }) => void;
  'round:randomized': (payload: {
    roundNumber: number;
    teams: TeamOrder[];
    animationType: 'shuffle' | 'instant';
  }) => void;
  'round:completed': (payload: { roundNumber: number }) => void;

  // Scoring events (operator only)
  'score:submitted': (payload: {
    teamId: string;
    teamName: string;
    juryId: string;
    juryName: string;
  }) => void;

  // Connection events
  'error': (error: { code: string; message: string }) => void;
}

// ═══════════════════════════════════════════════════════════
// CLIENT → SERVER EVENTS
// ═══════════════════════════════════════════════════════════

interface ClientToServerEvents {
  // Room management
  'join:event': (payload: { eventId: string }) => void;
  'leave:event': (payload: { eventId: string }) => void;

  // State requests
  'request:state': () => void;
}

// ═══════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

interface LiveState {
  eventId: string;
  currentStageId: string | null;
  currentStage: EventStage | null;
  currentTeamId: string | null;
  currentTeam: Team | null;
  timerState: TimerState | null;
  animationState: AnimationState | null;
  roundState: RoundState | null;
  updatedAt: string;
}

interface TimerState {
  type: 'presentation' | 'qa' | 'break' | 'custom';
  status: 'idle' | 'running' | 'paused' | 'completed';
  durationMs: number;
  serverStartTime: number | null;
  pausedRemainingMs: number | null;
  label?: string;
}

interface AnimationState {
  type: string;
  params: Record<string, any>;
  step: number;
  totalSteps: number;
  triggeredAt: number;
}

interface RoundState {
  roundNumber: number;
  teamOrder: string[];
  currentTeamIndex: number;
  completedTeamIds: string[];
  machineState: string;
}

interface TeamOrder {
  position: number;
  teamId: string;
  teamName: string;
  university: string;
}
```

### 19.2 API Response Formats

```typescript
// Standard API Response Formats

// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
  };
}

// Common Error Codes
const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_INVALID_CODE: 'Invalid jury access code',
  AUTH_TOKEN_EXPIRED: 'Authentication token has expired',
  AUTH_UNAUTHORIZED: 'You are not authorized to perform this action',

  // Validation
  VALIDATION_FAILED: 'Request validation failed',
  INVALID_INPUT: 'Invalid input provided',

  // Resources
  EVENT_NOT_FOUND: 'Event not found',
  TEAM_NOT_FOUND: 'Team not found',
  STAGE_NOT_FOUND: 'Stage not found',
  PROFILE_NOT_FOUND: 'Profile not found',

  // Business Logic
  RESULTS_LOCKED: 'Results have been locked and cannot be modified',
  SCORING_INCOMPLETE: 'Not all teams have been scored by all jury',
  INVALID_STAGE_TRANSITION: 'Cannot transition to this stage',
  TIMER_ALREADY_RUNNING: 'A timer is already running',

  // Server
  INTERNAL_ERROR: 'An internal server error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
};
```

### 19.3 Environment Variables Reference

```bash
# .env.example

# ═══════════════════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════════════════
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# ═══════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/event_platform

# ═══════════════════════════════════════════════════════════
# REDIS
# ═══════════════════════════════════════════════════════════
REDIS_URL=redis://localhost:6379

# ═══════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ═══════════════════════════════════════════════════════════
# FILE STORAGE (S3-compatible)
# ═══════════════════════════════════════════════════════════
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=event-platform-assets
CDN_URL=https://cdn.yourdomain.com

# For local development with MinIO:
# S3_ENDPOINT=http://localhost:9000
# AWS_ACCESS_KEY_ID=minioadmin
# AWS_SECRET_ACCESS_KEY=minioadmin

# ═══════════════════════════════════════════════════════════
# CORS
# ═══════════════════════════════════════════════════════════
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004

# ═══════════════════════════════════════════════════════════
# MONITORING (Optional)
# ═══════════════════════════════════════════════════════════
SENTRY_DSN=
LOG_LEVEL=debug

# ═══════════════════════════════════════════════════════════
# FRONTEND (Vite)
# ═══════════════════════════════════════════════════════════
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
```

---

## 20. Final Notes

This architecture document provides a comprehensive blueprint for building the UK Investment Challenge Live Event Platform. Key principles embedded throughout:

1. **Real-time First**: Every design decision prioritizes sub-second state synchronization
2. **Resilience**: Multiple fallback mechanisms for network/system failures
3. **Operator Experience**: The show operator can run the event smoothly with minimal technical knowledge
4. **Audience Impact**: FIFA-style animations and polished visuals for memorable experience
5. **Data Integrity**: Full audit trail for scoring, proper locking mechanisms
6. **Scalability**: Architecture supports multiple concurrent events if needed

### Recommended First Steps

1. **Week 1**: Set up monorepo, CI/CD, basic authentication
2. **Week 2-3**: Core data models, admin CRUD operations
3. **Week 4-5**: WebSocket infrastructure, live state management
4. **Week 6-8**: Operator controls, audience screens
5. **Week 9-10**: Jury scoring, awards ceremony
6. **Week 11-12**: Polish, testing, deployment

### Questions for Stakeholders

Before development begins, confirm:

1. Exact scoring criteria and weights
2. Number of teams per round (currently assumed 5)
3. Timer durations (currently 6 min presentation, 4 min Q&A)
4. Sound effect preferences (buzzer, reveal sounds)
5. Branding assets (logos, colors, fonts)
6. Hosting preferences (cloud provider, region)

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Author**: Technical Architecture Team
