import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { dashboardPathForRole } from './utils/roleRoutes'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Layout from './layouts/Layout'
import PHDashboard from './pages/PHC/PHDashboard'
import HospitalDashboard from './pages/Hospital/HospitalDashboard'
import SupervisorDashboard from './pages/Supervisor/SupervisorDashboard'
import CreateReferral from './pages/PHC/CreateReferral'
import ReferralList from './pages/Referrals/ReferralList'
import ReferralDetails from './pages/Referrals/ReferralDetails'
import PatientArrival from './pages/Hospital/PatientArrival'
import OutcomeRecording from './pages/Hospital/OutcomeRecording'
import BackReferralManagement from './pages/Hospital/BackReferralManagement'
import FollowUpWorkspace from './pages/FollowUp/FollowUpWorkspace'
import QRReferenceView from './pages/QR/QRReferenceView'
import Settings from './pages/Settings/Settings.jsx'
import PatientDetails from './pages/Patients/PatientDetails'

// Protected Route Component - uses AuthContext
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null // or a spinner
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Public landing route: signed-in users go straight to their dashboard.
function LandingRoute() {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (user) {
    return <Navigate to={dashboardPathForRole(profile?.role)} replace />
  }
  return <LandingPage />
}

// Sends a signed-in user to the dashboard that matches their role.
function DashboardRedirect() {
  const { profile } = useAuth()
  return <Navigate to={dashboardPathForRole(profile?.role)} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />
          <Route path="/phc-dashboard" element={
            <ProtectedRoute>
              <PHDashboard />
            </ProtectedRoute>
          } />
          <Route path="/referrals" element={
            <ProtectedRoute>
              <ReferralList />
            </ProtectedRoute>
          } />
          <Route path="/referrals/new" element={
            <ProtectedRoute>
              <CreateReferral />
            </ProtectedRoute>
          } />
          <Route path="/referrals/:id" element={
            <ProtectedRoute>
              <ReferralDetails />
            </ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute>
              <PatientDetails />
            </ProtectedRoute>
          } />
          <Route path="/hospital/intake" element={
            <ProtectedRoute>
              <HospitalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hospital-dashboard" element={
            <ProtectedRoute>
              <HospitalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hospital/arrival/:referralId" element={
            <ProtectedRoute>
              <PatientArrival />
            </ProtectedRoute>
          } />
          <Route path="/outcomes/:referralId" element={
            <ProtectedRoute>
              <OutcomeRecording />
            </ProtectedRoute>
          } />
          <Route path="/back-referral/:referralId" element={
            <ProtectedRoute>
              <BackReferralManagement />
            </ProtectedRoute>
          } />
          <Route path="/follow-ups" element={
            <ProtectedRoute>
              <FollowUpWorkspace />
            </ProtectedRoute>
          } />
          <Route path="/qr/:referralId" element={
            <ProtectedRoute>
              <QRReferenceView />
            </ProtectedRoute>
          } />
          <Route path="/supervisor" element={
            <ProtectedRoute>
              <SupervisorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/supervisor-dashboard" element={
            <ProtectedRoute>
              <SupervisorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}