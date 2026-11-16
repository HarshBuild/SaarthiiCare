import React, { useState } from 'react'
import { Activity, FileText, Users, CheckCircle, AlertTriangle, Clock, ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react'
import Button from '../components/ui/Button'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Alert from '../components/ui/Alert'
import Tabs from '../components/ui/Tabs'
import Table from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/layout/StatCard'
import ReferralTimeline from '../components/layout/ReferralTimeline'

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  // Demo data for table
  const sampleReferrals = [
    {
      id: 'REF-2026-001',
      patientName: 'Rahul Kumar',
      patientId: 'PAT-0042',
      facility: 'District Hospital Bareilly',
      specialty: 'Cardiology',
      status: 'acknowledged',
      date: '2026-11-15',
    },
    {
      id: 'REF-2026-002',
      patientName: 'Sunita Devi',
      patientId: 'PAT-0089',
      facility: 'Sub-District Hospital Aonla',
      specialty: 'Obstetrics',
      status: 'arrived',
      date: '2026-11-14',
    },
    {
      id: 'REF-2026-003',
      patientName: 'Amit Sharma',
      patientId: 'PAT-0120',
      facility: 'District Hospital Bareilly',
      specialty: 'Orthopedics',
      status: 'outcome_recorded',
      date: '2026-11-12',
    },
  ]

  const tableColumns = [
    { key: 'id', label: 'Referral ID', render: (row) => <span className="font-mono font-medium text-slate-900">{row.id}</span> },
    { key: 'patientName', label: 'Patient Name' },
    { key: 'facility', label: 'Receiving Facility' },
    { key: 'specialty', label: 'Specialty' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variants = {
          acknowledged: 'warning',
          arrived: 'teal',
          outcome_recorded: 'success',
        }
        return <Badge variant={variants[row.status] || 'default'}>{row.status.replace('_', ' ')}</Badge>
      },
    },
    { key: 'date', label: 'Date' },
  ]

  const sampleEvents = [
    { type: 'created', timestamp: '2026-11-15T09:30:00Z', description: 'Referral issued from PHC Rampur', user: 'Dr. Priya Sharma' },
    { type: 'acknowledged', timestamp: '2026-11-15T10:15:00Z', description: 'Acknowledged by District Hospital Bareilly', user: 'Intake Staff' },
    { type: 'arrived', timestamp: '2026-11-15T11:45:00Z', description: 'Patient physical arrival logged', user: 'Reception Desk' },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">SAARTHII Design System</h1>
        <p className="mt-1 text-sm text-slate-500">
          Healthcare Referral & Follow-Up Coordination Platform — Component Showcase
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Outgoing"
          value="142"
          change={12}
          changeLabel="vs last month"
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Pending Ack"
          value="8"
          change={-5}
          changeLabel="vs yesterday"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Outcome Recorded"
          value="98"
          change={18}
          changeLabel="vs last month"
          icon={CheckCircle}
          variant="teal"
        />
        <StatCard
          title="Closed Referrals"
          value="84"
          change={24}
          changeLabel="closure rate 86%"
          icon={ShieldCheck}
          variant="success"
        />
      </div>

      {/* Alerts Showcase */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">System Alerts</h2>
        <Alert
          variant="warning"
          title="Referral Closure Intelligence Warning"
          message="Referral REF-2026-003 is blocked from closure: Back-referral document required from District Hospital."
          dismissible
        />
        <Alert
          variant="info"
          title="ABDM Health ID Sync"
          message="Patient identity linked with ABHA ID 14-9928-1102-4412."
        />
      </div>

      {/* Tabs Showcase */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Component Tabs Showcase</h2>
        <Tabs
          activeIndex={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            {
              id: 'overview',
              label: 'Referral Queue',
              icon: <FileText />,
              badge: 3,
              content: (
                <div className="space-y-4 pt-2">
                  <Table columns={tableColumns} data={sampleReferrals} />
                </div>
              ),
            },
            {
              id: 'timeline',
              label: 'Audit Timeline',
              icon: <Activity />,
              content: (
                <Card className="mt-2">
                  <CardHeader>
                    <div>
                      <CardTitle>Referral REF-2026-001 Lifecycle</CardTitle>
                      <CardDescription>Immutable append-only audit event history</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ReferralTimeline events={sampleEvents} />
                  </CardContent>
                </Card>
              ),
            },
            {
              id: 'form',
              label: 'Form Components',
              icon: <Stethoscope />,
              content: (
                <Card className="mt-2 max-w-xl">
                  <CardHeader>
                    <CardTitle>Sample Referral Creation Form</CardTitle>
                    <CardDescription>Form controls with error handling and validation states</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <Input
                      label="Patient ABHA ID / Name"
                      placeholder="e.g. 14-9928-1102-4412 or Rahul Kumar"
                      helperText="Enter ABHA number for instant verification"
                    />
                    <Select
                      label="Receiving Facility"
                      placeholder="Select target facility..."
                      options={[
                        { value: 'dh_bareilly', label: 'District Hospital Bareilly' },
                        { value: 'sdh_aonla', label: 'Sub-District Hospital Aonla' },
                      ]}
                    />
                    <Input
                      label="Specialty Required"
                      placeholder="e.g. Cardiology, Orthopedics"
                    />
                  </CardContent>
                  <CardFooter>
                    <Button variant="primary" onClick={() => setModalOpen(true)}>
                      Test Modal Dialog
                    </Button>
                    <Button variant="outline">Cancel</Button>
                  </CardFooter>
                </Card>
              ),
            },
          ]}
        />
      </div>

      {/* Modal Dialog Showcase */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Referral Closure Intelligence Check"
        description="Rule Engine Evaluation Results for REF-2026-003"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Acknowledge & Action
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Alert variant="warning" title="Closure Blocked">
            The RCI Engine evaluated this referral contract. Closure is currently blocked due to missing workflow requirements.
          </Alert>
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Missing Obligations:</h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger-500" />
                Back-Referral Report (District Hospital Bareilly)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning-500" />
                Community Follow-Up Task #TK-104 (PHC Nurse)
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  )
}