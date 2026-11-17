<div align="center">

# SaarthiCare Frontend

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge&logo=appveyor)]
[![Build](https://img.shields.io/badge/Build-Vite%20%2B%20React-blue?style=for-the-badge&logo=vite)]
[![Pages](https://img.shields.io/badge/Hosted-OnCloudflare%20Pages-purple?style=for-the-badge&logo=cloudflare)]

[Live Demo](https://saarthii-web.pages.dev) • [Read Me](https://saarthii-web.pages.dev/read-me) • [Project Structure](https://github.com/HarshBuild/SaarthiiCare/tree/master/frontend)

</div>

---

## 🎯 Frontend Overview

This repository contains the **React + Vite** frontend for **SaarthiCare**, an intelligent healthcare referral and patient navigation SaaS platform.

### Key Features

- **Multi-Role Dashboards**: PHC Operators, Specialist Doctors/Hospitals, and Health Supervisors
- **Real-time Notifications**: Notification center with status updates
- **Referral Workflows**: Complete end-to-end referral lifecycle tracking
- **Appointment Scheduling**: Integrated calendar and booking system
- **Responsive Design**: Optimized for mobile, tablet, and desktop

### Technology Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **Routing**: React Router
- **Build Tools**: Vite, PostCSS
- **Deployment**: Cloudflare Pages

---

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
cd SaarthiCare

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

The built files will be available in the `dist/` directory.

---

## 📁 Project Structure

```
src/
├── App.jsx                 # Main application component
├── main.jsx                # Entry point
├── index.css              # Global styles
├── components/             # Reusable UI components
├── pages/                  # Route components (dashboards, forms)
├── services/               # API client integrations
└── utils/                  # Helper functions (calendar, status handlers)
```

---

## 🔧 Environment Variables

### `.env.example`

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### `.env`

Copy `.env.example` to `.env` and replace values with your configuration.

---

## 🌐 Live Demo

Once deployed, the frontend will be available at:

- **Main Application**: `https://saarthii-web.pages.dev`
- **Read Me Documentation**: `https://saarthii-web.pages.dev/read-me`

The frontend communicates with the backend API at `https://saarthii-api.onrender.com/api`.

---

## 🎨 Styling & Design

The frontend uses **Tailwind CSS** for utility-first styling and **Lucide Icons** for consistent iconography throughout the application.

### Design Features

- **Responsive Layouts**: Optimized for all screen sizes
- **Dark Mode Ready**: Supports both light and dark themes
- **Accessibility**: Semantic HTML5 and ARIA attributes
- **Performance Optimized**: Code splitting and lazy loading

---

## 🔒 Security

### Frontend Security

- **Environment Variables**: Sensitive configuration kept outside version control
- **CORS**: Configured by backend API server
- **Content Security Policy**: Implemented via Vite configuration

### Development Best Practices

- **Local HTTPS**: Required for development server
- **ESLint & Prettier**: Code quality tools
- **Component Testing**: Structure for easy testing integration

---

## 📧 Contact & Support

For questions about the frontend implementation:

- **GitHub Issues**: [Open an issue in the repository](https://github.com/HarshBuild/SaarthiiCare/issues)
- **Pull Requests**: Contributions are welcome
- **Discussions**: Feature requests and technical discussions

---

## 📜 License

Frontend is part of the SaarthiCare project. See the main repository for license information.

---

<div align="center">

*Modern, performant React frontend for healthcare referral management*

[Back to Top](#-saarthicare-frontend)

</div>
