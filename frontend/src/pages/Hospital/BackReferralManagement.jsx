import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, User, Stethoscope, Shield, ArrowLeft, CheckCircle, FileText, Send, AlertCircle } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { ReferralDetailsClient, HospitalClient } from '../../services/referralsService'

export default function BackReferralManagement() {
  const { referralId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [referral, setReferral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    outcome_summary: '',
    recommendations: '',
    follow_up_recommended_date: '',
    back_referral_sent: true,
  })

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
      await HospitalClient.createBackReferral(referralId, formData)
      toast.success('Back-referral sent to the originating PHC.', 'Back referral sent')
      navigate(`/referrals/${referralId}`)
    } catch (err) {
      setError('Failed to send back-referral. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
          <h1 className="text-2xl font-bold text-slate-900">Back Referral</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-12 bg-slate-200/60 rounded-xl animate-pulse" />
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
        <h1 className="text-2xl font-bold text-slate-900">Create Back Referral</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-100 text-teal-600">
                    <Shield className="h-5 w-5" />
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
                <Alert
                  variant="info"
                  title="Important"
                  dismissible
                  message="Back-referrals are sent to the originating PHC and are part of closure tracking. This document serves as discharge documentation."
                />

                <div className="space-y-4">
                  {/* Treatment Outcome Summary */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Treatment Outcome Summary *
                    </label>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed resize-y"
                      placeholder="Concise summary of treatment provided and outcome..."
                      rows={3}
                      value={formData.outcome_summary}
                      onChange={(e) => handleInputChange('outcome_summary', e.target.value)}
                      required
                    />
                  </div>

                  {/* Recommendations */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Recommendations for PHC
                    </label>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed resize-y"
                      placeholder="Any follow-up care, medications, or recommendations for the originating PHC..."
                      rows={3}
                      value={formData.recommendations}
                      onChange={(e) => handleInputChange('recommendations', e.target.value)}
                    />
                  </div>

                  {/* Follow-up Date */}
                  <div>
                    <Input
                      label="Recommended Follow-up Date"
                      type="date"
                      value={formData.follow_up_recommended_date}
                      onChange={(e) => handleInputChange('follow_up_recommended_date', e.target.value)}
                    />
                  </div>

                  {/* Send Checkbox */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.back_referral_sent}
                        onChange={(e) => handleInputChange('back_referral_sent', e.target.checked)}
                        className="h-4 w-4 rounded border border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span>Send back-referral report to originating PHC</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      This will complete the referral closure workflow when all required actions are recorded.
                    </p>
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
                      <Send className="h-4 w-4 mr-2 animate-pulse" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Back Referral
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
                <CardTitle>Closure Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>RCI Closure Check</span>
                    </h4>
                    <p className="text-xs text-amber-700">
                      Referral cannot be closed until:
                    </p>
                    <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3" />
                        <span>Outcome recorded</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3" />
                        <span>Back referral submitted (this)</span>
                      </li>
                    </ul>
                  </div>

                  <Link to={`/qr/${referralId}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      View QR Reference
                    </Button>
                  </Link>

                  <p className="text-xs text-slate-500 pt-2">
                    After sending this back-referral, the originating PHC will be able to close the referral in their system.
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