import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, User, Stethoscope, Shield, ArrowLeft, CheckCircle, AlertCircle, FileText, ShieldCheck, Clock } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { ReferralDetailsClient, HospitalClient } from '../../services/referralsService'

export default function OutcomeRecording() {
  const { referralId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [referral, setReferral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    outcome_category: '',
    clinical_notes: '',
    recommendations: '',
    follow_up_date: '',
  })

  const outcomeCategories = [
    { value: 'recovered', label: 'Recovered - Full Recovery' },
    { value: 'improved', label: 'Improved - Significant Improvement' },
    { value: 'stable', label: 'Stable - Condition Stabilized' },
    { value: 'worsened', label: 'Condition Worsened - Needs Further Care' },
    { value: 'discharged', label: 'Discharged - Home/Discharged' },
    { value: 'transferred', label: 'Transferred to Another Facility' },
  ]

  useEffect(() => {
    fetchReferralDetails()
  }, [referralId])

  const fetchReferralDetails = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ReferralDetailsClient.get(referralId)
      setReferral(data)
    } catch (err) {
      setError('Failed to load referral details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await HospitalClient.recordOutcome(referralId, formData)
      toast.success('Treatment outcome recorded successfully.', 'Outcome saved')
      navigate(`/referrals/${referralId}`)
    } catch (err) {
      setError('Failed to record outcome. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getOutcomeIcon = (category) => {
    const icons = {
      recovered: CheckCircle,
      improved: ShieldCheck,
      stable: Shield,
      worsened: AlertCircle,
      discharged: User,
      transferred: ArrowLeft,
    }
    return icons[category] || FileText
  }

  const getOutcomeColor = (category) => {
    const colors = {
      recovered: 'teal',
      improved: 'success',
      stable: 'info',
      worsened: 'warning',
      discharged: 'default',
      transferred: 'info',
    }
    return colors[category] || 'default'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to={`/referrals/${referralId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Treatment Outcome</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-8 bg-slate-200/60 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-200/60 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !referral) {
    return (
      <div className="space-y-6">
        <Alert variant="danger" title="Error" message={error || 'Referral not found'} />
        <Link to="/hospital-dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to={`/referrals/${referralId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Record Treatment Outcome</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Referral: {referral.referral_number || '—'}</CardTitle>
                    <CardDescription>
                      {referral.patient_name || 'Patient'} • {referral.specialty?.replace(/_/g, ' ') || 'Specialty'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Outcome Category */}
                  <div>
                    <Select
                      label="Outcome Category"
                      placeholder="Select the patient's outcome..."
                      options={outcomeCategories}
                      value={formData.outcome_category}
                      onChange={(e) => setFormData(prev => ({ ...prev, outcome_category: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Clinical Notes */}
                  <div>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed resize-y"
                      placeholder="Detailed clinical notes about the treatment and patient condition... Be specific about diagnosis, treatment administered, and patient response."
                      rows={5}
                      value={formData.clinical_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinical_notes: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Recommendations */}
                  <div>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed resize-y"
                      placeholder="Recommendations for next steps, medications, follow-up care, or referral back to sending facility..."
                      rows={3}
                      value={formData.recommendations}
                      onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                    />
                  </div>

                  {/* Follow-up Date */}
                  <div>
                    <Input
                      label="Follow-up Date (Optional)"
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => navigate(`/referrals/${referralId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  {submitting ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                      Recording...
                    </>
                  ) : (
                    <>
                      Record Outcome
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar Notes */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Outcome Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm">Select an outcome category to see details</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Post-Outcome Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link to={`/back-referral/${referralId}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Request Back Referral
                    </Button>
                  </Link>
                  <p className="text-xs text-slate-500">
                    Recorded outcomes automatically trigger back-referral workflows when required.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}