import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Stethoscope, Shield, Calendar, Check, AlertTriangle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import { useToast } from '../../components/ui/Toast'
import { ReferralListClient } from '../../services/referralsService'

export default function CreateReferral() {
  const toast = useToast()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    abhaId: '',
    age: '',
    gender: '',
    specialty: '',
    reason: '',
    clinicalSummary: '',
    backReferralRequired: true,
    followUpRequired: false,
    followUpDate: '',
    receivingFacility: '',
  })

  const steps = [
    { id: 'patient', label: 'Patient Details', icon: Stethoscope },
    { id: 'referral', label: 'Referral Details', icon: Shield },
    { id: 'review', label: 'Review & Issue', icon: AlertCircle },
  ]

  const facilities = [
    { value: 'dh_bareilly', label: 'District Hospital Bareilly' },
    { value: 'sdh_aonla', label: 'Sub-District Hospital Aonla' },
  ]

  const specialties = [
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'obstetrics', label: 'Obstetrics & Gynecology' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'ophthalmology', label: 'Ophthalmology' },
  ]

  const navigate = useNavigate()

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => setActiveStep(prev => Math.min(prev + 1, steps.length - 1))
  const prevStep = () => setActiveStep(prev => Math.max(prev - 1, 0))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const referralData = {
        patient_id: formData.abhaId || formData.patientId || formData.patientName,
        patient_name: formData.patientName,
        patient_age: formData.age ? parseInt(formData.age, 10) : undefined,
        patient_gender: formData.gender,
        receiving_facility_id: formData.receivingFacility,
        specialty: formData.specialty,
        reason: formData.reason,
        clinical_summary: formData.clinicalSummary,
        back_referral_required: formData.backReferralRequired,
        follow_up_required: formData.followUpRequired,
        follow_up_due_date: formData.followUpDate || undefined,
      }

      const result = await ReferralListClient.create(referralData)
      toast.success(
        `Referral ${result.referral_number || ''} created and issued to the receiving facility.`,
        'Referral created'
      )
      navigate(`/referrals/${result.id}`)
    } catch (err) {
      const detail = err.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg).join(', ')
        : detail
      setError(message || 'Failed to create referral. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              label="Patient Name"
              placeholder="e.g. Rahul Kumar"
              value={formData.patientName}
              onChange={(e) => handleInputChange('patientName', e.target.value)}
              required
              icon={Stethoscope}
            />
            <Input
              label="ABHA Number / Patient ID"
              placeholder="e.g. 14-9928-1102-4412"
              value={formData.abhaId}
              onChange={(e) => handleInputChange('abhaId', e.target.value)}
              required
              icon={AlertCircle}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Age"
                type="number"
                placeholder="Years"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                required
              />
              <Select
                label="Gender"
                placeholder="Select gender"
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                required
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <Select
              label="Receiving Facility"
              placeholder="Select target hospital..."
              options={facilities}
              value={formData.receivingFacility}
              onChange={(e) => handleInputChange('receivingFacility', e.target.value)}
              required
            />
            <Select
              label="Specialty Required"
              placeholder="Select required specialty..."
              options={specialties}
              value={formData.specialty}
              onChange={(e) => handleInputChange('specialty', e.target.value)}
              required
            />
            <div>
              <Input
                label="Clinical Reason"
                placeholder="Brief reason for referral..."
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                required
              />
            </div>
            <div>
              <textarea
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed resize-y"
                placeholder="Detailed clinical summary for receiving doctor..."
                rows={4}
                value={formData.clinicalSummary}
                onChange={(e) => handleInputChange('clinicalSummary', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.backReferralRequired}
                    onChange={(e) => handleInputChange('backReferralRequired', e.target.checked)}
                    className="h-4 w-4 rounded border border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
                  />
                  Back-referral required
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.followUpRequired}
                    onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                    className="h-4 w-4 rounded border border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
                  />
                  Follow-up required
                </label>
              </div>
            </div>
            {formData.followUpRequired && (
              <Input
                label="Follow-up Due Date"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                required
              />
            )}
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-600" />
                Referral Summary
              </h3>
              <dl className="divide-y divide-slate-200 space-y-2">
                <div className="py-2">
                  <dt className="text-xs text-slate-500">Patient</dt>
                  <dd className="text-sm font-medium text-slate-900">{formData.patientName}</dd>
                </div>
                <div className="py-2">
                  <dt className="text-xs text-slate-500">Referral To</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {facilities.find(f => f.value === formData.receivingFacility)?.label || '...'}
                  </dd>
                </div>
                <div className="py-2">
                  <dt className="text-xs text-slate-500">Specialty</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {specialties.find(s => s.value === formData.specialty)?.label || '...'}
                  </dd>
                </div>
                <div className="py-2">
                  <dt className="text-xs text-slate-500">Workflow Flags</dt>
                  <dd className="flex items-center gap-2 flex-wrap">
                    <Badge variant={formData.backReferralRequired ? 'warning' : 'success'}>
                      {formData.backReferralRequired ? 'Back-Ref Required' : 'No Back-Ref'}
                    </Badge>
                    <Badge variant={formData.followUpRequired ? 'teal' : 'default'}>
                      {formData.followUpRequired ? 'Follow-up Required' : 'No Follow-up'}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Referral Closure Intelligence
              </h4>
              <p className="mt-1 text-sm text-amber-700">
                RCI will block referral closure until all required actions are completed:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-700">
                {formData.backReferralRequired && (
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Back-referral document submitted by receiving facility</span>
                  </li>
                )}
                {formData.followUpRequired && (
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Community follow-up completed by PHC staff</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )
    }
  }

  const canProceed = () => {
    if (activeStep === 0) {
      return formData.patientName && formData.abhaId && formData.gender
    }
    if (activeStep === 1) {
      return formData.receivingFacility && formData.specialty && formData.reason
    }
    return true
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Referral</h1>
        <p className="mt-1 text-sm text-slate-500">
          Issue a digital referral to a receiving healthcare facility
        </p>
      </div>

      {error && <Alert variant="danger" title="Error" message={error} />}

      {/* Progress Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  index === activeStep 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/25' 
                    : index < activeStep 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-100 text-slate-600'
                }`}>
                  {step.icon && <step.icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs font-medium ${
                  index === activeStep ? 'text-teal-600' : index < activeStep ? 'text-emerald-600' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden sm:block h-px w-16 bg-slate-200" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Step {activeStep + 1}: {steps[activeStep].label}</CardTitle>
          <CardDescription>
            {activeStep === 0 && 'Enter patient details and select receiving facility'}
            {activeStep === 1 && 'Specify clinical details and workflow requirements'}
            {activeStep === 2 && 'Review and issue the referral'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={activeStep === 0 || loading}
          >
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={loading || !canProceed()}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Issue Referral
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}