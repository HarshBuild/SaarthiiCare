# SAARTHII Healthcare Platform - UI/UX Premium Transformation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform SAARTHII healthcare referral platform's UI/UX into a world-class, modern, enterprise-grade SaaS product with rich visuals, sleek dark/light navigation, responsive mobile controls, and polished micro-interactions, while 100% preserving all backend APIs, database connections, and business logic.

**Architecture:** Vite + React 18 + Tailwind CSS 3 + Lucide React icons. Shared component system in `src/components/ui/`, layout shell in `src/layouts/Layout.jsx`, pages under `src/pages/`, and design tokens in `src/styles/`.

---

### Task 1: Enhanced Design Tokens & CSS Component Library
- **Files:** `frontend/src/styles/index.css`, `frontend/src/styles/components.css`, `frontend/tailwind.config.js`
- **Actions:** Define extended theme palette (Navy `#0F172A`, Teal `#0D9488`, Emerald, Slate, Rose, Amber accents), custom glassmorphism, subtle shadows, scrollbars, keyframe animations, typography rules.

### Task 2: Core UI Components Modernization
- **Files:** `frontend/src/components/ui/Button.jsx`, `Card.jsx`, `Badge.jsx`, `Alert.jsx`, `Input.jsx`, `Select.jsx`, `Textarea.jsx`, `Switch.jsx`, `Table.jsx`, `Modal.jsx`, `Tabs.jsx`, `EmptyState.jsx`, `frontend/src/components/layout/StatCard.jsx`
- **Actions:** Upgrade buttons, input controls, cards, table styling, stat widgets, badges, alerts, empty states, and modal dialogs with micro-interactions, hover states, icons, and focus states.

### Task 3: Layout Shell & Navigation Overhaul
- **Files:** `frontend/src/layouts/Layout.jsx`
- **Actions:** Modern dark/slate sidebar navigation with collapsible state, active tab glow indicator, role badges, header bar with search bar, notification dropdown demo, user menu, and breadcrumbs.

### Task 4: Authentication & Landing Page Redesign
- **Files:** `frontend/src/pages/Login.jsx`
- **Actions:** Transform login page into a split layout with healthcare artwork on the left, quick demo role selector buttons (`PHC Staff`, `Hospital Specialist`, `District Supervisor`, `Admin`), and glassmorphism form card.

### Task 5: Primary Care (PHC) & Referral Management Redesign
- **Files:** `frontend/src/pages/PHC/PHDashboard.jsx`, `CreateReferral.jsx`, `frontend/src/pages/Referrals/ReferralList.jsx`, `ReferralDetails.jsx`
- **Actions:** Upgrade PHC dashboard with quick action cards and stat widgets; upgrade referral creation wizard with multi-step progress stepper; redesign referral list table with status filters, search, and badges; build detailed referral dossier with timeline visualization and RCI closure eligibility widget.

### Task 6: Secondary Care (Hospital) Operations Redesign
- **Files:** `frontend/src/pages/Hospital/HospitalDashboard.jsx`, `PatientArrival.jsx`, `OutcomeRecording.jsx`, `BackReferralManagement.jsx`
- **Actions:** Upgrade Hospital Specialist Dashboard with intake counters and quick-action cards; redesign Patient Arrival digital check-in modal/page; redesign Outcome Recording with diagnostic outcome selector; redesign Back-Referral Management page with primary care discharge instructions.

### Task 7: Supervisor Analytics, QR Pass, Patients & Settings Redesign
- **Files:** `frontend/src/pages/Supervisor/SupervisorDashboard.jsx`, `frontend/src/pages/QR/QRReferenceView.jsx`, `frontend/src/pages/Settings/Settings.jsx`, `frontend/src/pages/Patients/PatientDetails.jsx`, `frontend/src/pages/FollowUp/FollowUpWorkspace.jsx`
- **Actions:** Upgrade Supervisor analytics dashboard with high-impact stat counters, overdue SLA alert panel, district performance charts; redesign printable QR referral ticket view; redesign patient details timeline; redesign CHW follow-up workspace; polish system settings.

### Task 8: Verification & Build Quality Check
- **Actions:** Run `npm run build` in `frontend` to guarantee 0 build errors; verify backend connection; test responsive layouts across viewports.
