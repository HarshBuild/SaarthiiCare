import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
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

// Protected Route Component
function ProtectedRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/phc-dashboard" replace />} />
          <Route path="/dashboard" element={<Navigate to="/phc-dashboard" replace />} />
          <Route path="/phc-dashboard" element={
            <ProtectedRoute user={null}>
              <PHDashboard />
            </ProtectedRoute>
          } />
          <Route path="/referrals" element={
            <ProtectedRoute user={null}>
              <ReferralList />
            </ProtectedRoute>
          } />
          <Route path="/referrals/new" element={
            <ProtectedRoute user={null}>
              <CreateReferral />
            </ProtectedRoute>
          } />
          <Route path="/referrals/:id" element={
            <ProtectedRoute user={null}>
              <ReferralDetails />
            </ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute user={null}>
              <PatientDetails />
            </ProtectedRoute>
          } />
          <Route path="/hospital/intake" element={
            <ProtectedRoute user={null}>
              <HospitalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hospital-dashboard" element={
            <ProtectedRoute user={null}>
              <HospitalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hospital/arrival/:referralId" element={
            <ProtectedRoute user={null}>
              <PatientArrival />
            </ProtectedRoute>
          } />
          <Route path="/outcomes/:referralId" element={
            <ProtectedRoute user={null}>
              <OutcomeRecording />
            </ProtectedRoute>
          } />
          <Route path="/back-referral/:referralId" element={
            <ProtectedRoute user={null}>
              <BackReferralManagement />
            </ProtectedRoute>
          } />
          <Route path="/follow-ups" element={
            <ProtectedRoute user={null}>
              <FollowUpWorkspace />
            </ProtectedRoute>
          } />
          <Route path="/qr/:referralId" element={
            <ProtectedRoute user={null}>
              <QRReferenceView />
            </ProtectedRoute>
          } />
          <Route path="/supervisor" element={
            <ProtectedRoute user={null}>
              <SupervisorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/supervisor-dashboard" element={
            <ProtectedRoute user={null}>
              <SupervisorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute user={null}>
              <Settings />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}