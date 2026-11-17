# SaarthiiCare Frontend Transformation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform SaarthiiCare into a premium healthcare SaaS platform with a modern, high-performance UI/UX.

**Architecture:** Use Tailwind CSS for a consistent design system, Lucide React for iconography, and a component-based approach to ensure reusability. The layout will be a modern dashboard shell with role-based variations.

**Tech Stack:** React, Tailwind CSS, Lucide React, Framer Motion (for subtle animations).

**Spec:** [User's ULTIMATE MASTER PROMPT]

## Global Constraints
- Primary Color: Deep Healthcare Blue (#0f172a / #0d9488)
- Background: Very Light Blue/Off-White (#f8fafc)
- Font: Inter (System UI fallback)
- Design Direction: Clean, minimal, premium typography, consistent spacing.
- Responsive: Full support for Desktop, Tablet, and Mobile.

## Review Focus
- **Visual Consistency:** Check that all pages use the same color palette, spacing, and typography tokens.
- **Responsiveness:** Verify the layout on mobile (375px), tablet (768px), and desktop (1280px+).
- **Functionality:** Ensure every button, form, and search field connects to the actual backend or Supabase state.
- **Loading States:** Verify skeleton loaders appear during data fetching.
- **Empty States:** Ensure meaningful empty states are shown when no data is available.

---

### Task 1: Design System & Tailwind Configuration

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/styles/index.css`

**Interfaces:**
- Produces: Global CSS classes and Tailwind theme extensions.

- [ ] **Step 1: Update `tailwind.config.js` with premium tokens**
  - Add primary (Teal/Navy), secondary, and status colors.
  - Define a scale for spacing and border-radius (rounded-xl/2xl).
- [ ] **Step 2: Enhance `index.css` with global styles**
  - Implement the radial background pattern.
  - Add custom scrollbar styles.
  - Define glassmorphism classes (`.glass-panel`).
- [ ] **Step 3: Verify the build**
  - Run `npm run build` to ensure Tailwind configuration is valid.

### Task 2: Premium Landing Page Redesign

**Files:**
- Modify: `frontend/src/pages/Home.jsx`
- Create: `frontend/src/components/landing/LandingNavbar.jsx`
- Create: `frontend/src/components/landing/LandingFooter.jsx`

**Interfaces:**
- Consumes: UI components (Button, Badge).

- [ ] **Step 1: Implement the Landing Navbar**
  - Sticky header with glass effect.
- [ ] **Step 2: Rebuild the Hero Section**
  - "Every Referral Connected. Every Patient Followed Up."
  - Modern split layout with call-to-action buttons.
- [ ] **Step 3: Implement Feature & Workflow Sections**
  - Visualization of the referral journey.
  - Benefits for different roles (Doctors, Hospitals, Patients).
- [ ] **Step 4: Verify responsiveness**
  - Ensure the landing page looks great on mobile.

### Task 3: Authentication UI Overhaul

**Files:**
- Modify: `frontend/src/pages/Login.jsx`

**Interfaces:**
- Consumes: `useAuth` hook, `Input`, `Button`.

- [ ] **Step 1: Redesign Login Page layout**
  - Modern split-screen layout (Illustration on one side, form on the other).
- [ ] **Step 2: Enhance form validation and feedback**
  - Add loading indicators and clear error messages.
- [ ] **Step 3: Verify login flow**
  - Ensure it still connects correctly to `signIn` from `AuthContext`.

### Task 4: Dashboard Shell & Layout Enhancement

**Files:**
- Modify: `frontend/src/layouts/Layout.jsx`

**Interfaces:**
- Consumes: `useAuth`, Lucide icons.

- [ ] **Step 1: Refine the Sidebar**
  - Improved active states and hover effects.
  - Collapsible behavior for better space management.
- [ ] **Step 2: Enhance the Header**
  - Add a refined search bar and notification center placeholder.
  - Update breadcrumbs for better navigation context.
- [ ] **Step 3: Implement mobile navigation menu**
  - Slide-over drawer for mobile devices.

### Task 5: Role-Specific Dashboard Polishing

**Files:**
- Modify: `frontend/src/pages/PHC/PHDashboard.jsx`
- Modify: `frontend/src/pages/Hospital/HospitalDashboard.jsx`
- Modify: `frontend/src/pages/Supervisor/SupervisorDashboard.jsx`

**Interfaces:**
- Consumes: `StatCard`, `Table`, `ReferralListClient`.

- [ ] **Step 1: Update PHC Dashboard**
  - Premium KPI cards and priority referral lists.
- [ ] **Step 2: Update Hospital Dashboard**
  - Intake queue with urgency badges and quick actions.
- [ ] **Step 3: Update Supervisor Dashboard**
  - Analytics charts and overdue referral monitoring.

### Task 6: Referral Management & Workflow UI

**Files:**
- Modify: `frontend/src/pages/Referrals/ReferralList.jsx`
- Modify: `frontend/src/pages/Referrals/ReferralDetails.jsx`
- Modify: `frontend/src/components/layout/ReferralTimeline.jsx`

**Interfaces:**
- Consumes: `Badge`, `Card`, `Timeline`.

- [ ] **Step 1: Enhance Referral List**
  - Advanced filtering and search interactions.
- [ ] **Step 2: Redesign Referral Details**
  - Premium timeline visualization of the referral lifecycle.
  - Clear "Closure Intelligence" panel.
- [ ] **Step 3: Add subtle Framer Motion animations**
  - Fade-ins for content loading and transitions between status updates.

### Task 7: Final Debugging & Quality Pass

**Files:**
- All modified files.

- [ ] **Step 1: Run Lint & Type checks**
  - Fix any warnings or errors.
- [ ] **Step 2: Verify all interactive elements**
  - Test every button, link, and form across the app.
- [ ] **Step 3: Performance optimization**
  - Ensure images and assets are optimized.
- [ ] **Step 4: Final Production Build**
  - Run `npm run build` and verify the output.
