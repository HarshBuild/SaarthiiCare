import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, User, Stethoscope, Shield, ArrowLeft, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { ReferralDetailsClient, HospitalClient } from '../../services/referralsService'

export default function PatientArrival() {
  const { referralId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [referral, setReferral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    patient_id: '',
    arrival_time: new Date().toISOString(),
    notes: '',
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
      await HospitalClient.recordArrival(referralId, formData)
      toast.success('Patient arrival recorded successfully.', 'Arrival logged')
      navigate(`/referrals/${referralId}`)
    } catch (err) {
      setError('Failed to record patient arrival. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/hospital-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Patient Arrival</h1>
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
        <h1 className="text-2xl font-bold text-slate-900">Record Patient Arrival</h1>
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
                  {/* Patient Info */}
                  <div>
                    <Input
                      label="Patient ID / ABHA Number"
                      placeholder="e.g. 14-9928-1102-4412"
                      value={formData.patient_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, patient_id: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Arrival Time */}
                  <div>
                    <Input
                      label="Arrival Time"
                      type="datetime-local"
                      value={formData.arrival_time.slice(0, 16)}
                      onChange={(e) => setFormData(prev => ({ ...prev, arrival_time: e.target.value }))}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed resize-y"
                      placeholder="Any additional notes about the arrival, vital signs, or initial assessment..."
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Record Arrival
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
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link to={`/outcomes/${referralId}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Record Treatment Outcome
                    </Button>
                  </Link>
                  <div className="text-sm text-slate-600 p-3 rounded-lg bg-slate-50">
                    <h4 className="text-xs font-medium text-slate-900 mb-1">Patient Ready For:</h4>
                    <ul className="text-xs space-y-1 text-slate-600">
                      <li>• Initial diagnosis and assessment</li>
                      <li>• Treatment plan documentation</li>
                      <li>• Referral to specialist department</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}