import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  FileText, Calendar, Shield, Stethoscope, ShieldCheck, Clock, 
  AlertCircle, CheckCircle, ArrowLeft, User, Heart, Activity, TrendingUp 
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { useToast } from '../../components/ui/Toast'
import { ReferralDetailsClient } from '../../services/referralsService'

export default function ReferralDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [referral, setReferral] = useState(null)
  const [closureCheck, setClosureCheck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReferralDetails()
  }, [id])

  const fetchReferralDetails = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ReferralDetailsClient.get(id)
      setReferral(data)

      // Closure intelligence is supplementary: a failure here should not hide
      // the referral record itself.
      try {
        const rci = await ReferralDetailsClient.checkClosure(id)
        setClosureCheck(rci)
      } catch (closureError) {
        setClosureCheck(null)
      }
    } catch (err) {
      setError('Failed to load referral details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseReferral = async () => {
    try {
      await ReferralDetailsClient.close(id)
      toast.success('Referral closed successfully.', 'Closed')
      fetchReferralDetails()
    } catch (err) {
      if (err.response?.status === 422) {
        toast.error(err.response.data.detail || 'Closure requirements are not met.', 'Cannot close referral')
      } else {
        toast.error('Failed to close referral. Please try again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/referrals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Referral Details</h1>
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
        <Link to="/referrals">
          <Button>Back to Referrals</Button>
        </Link>
      </div>
    )
  }

  const statusConfig = {
    draft: { color: 'default', label: 'Draft' },
    issued: { color: 'info', label: 'Issued' },
    pending_ack: { color: 'warning', label: 'Pending Acknowledgement' },
    acknowledged: { color: 'info', label: 'Acknowledged' },
    arrived: { color: 'teal', label: 'Patient Arrived' },
    outcome_recorded: { color: 'success', label: 'Outcome Recorded' },
    back_referral_pending: { color: 'warning', label: 'Back Referral Pending' },
    back_referral_completed: { color: 'success', label: 'Back Referral Completed' },
    follow_up_pending: { color: 'warning', label: 'Follow Up Pending' },
    follow_up_completed: { color: 'success', label: 'Follow Up Completed' },
    closed: { color: 'success', label: 'Closed' },
    rejected: { color: 'danger', label: 'Rejected' },
    cancelled: { color: 'default', label: 'Cancelled' },
  }

  const status = statusConfig[referral.status] || { color: 'default', label: referral.status }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/referrals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Referral Details</h1>
        </div>
        <Badge variant={status.color}>{status.label}</Badge>
      </div>

      {/* Referral Information Card */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Referral Information</CardTitle>
              <CardDescription>
                Referral {referral.referral_number || '—'}
                {referral.created_at ? ` • Created ${new Date(referral.created_at).toLocaleDateString()}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Patient ID / ABHA</p>
                  <p className="font-medium text-slate-900">{referral.patient_id || referral.abha_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Patient Name</p>
                  <p className="font-medium text-slate-900">{referral.patient_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Age / Gender</p>
                  <p className="font-medium text-slate-900">
                    {referral.patient_age || 'N/A'} / {(referral.patient_gender || referral.gender)?.charAt(0).toUpperCase() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Specialty Required</p>
                  <p className="font-medium text-slate-900">{referral.specialty?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Receiving Facility</p>
                  <p className="font-medium text-slate-900">{referral.receiving_facility_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Reason for Referral</p>
                  <p className="font-medium text-slate-900">{referral.reason || 'N/A'}</p>
                </div>
              </div>

              {referral.clinical_summary && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2">Clinical Summary</p>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-sm text-slate-700">{referral.clinical_summary}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Referral Closure Intelligence Panel */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-teal-600 mt-0.5" />
                <div>
                  <CardTitle className="text-base">Closure Intelligence</CardTitle>
                  <CardDescription>
                    Automated workflow validation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {closureCheck ? (
                <div className="space-y-4">
                  {/* Eligibility Status */}
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      {closureCheck.eligible_for_closure ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span className="font-medium text-emerald-900 text-sm">Eligible for Closure</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                          <span className="font-medium text-rose-900 text-sm">Blocked from Closure</span>
                        </>
                      )}
                    </div>
                    {closureCheck.eligible_for_closure ? (
                      <Button size="sm" onClick={handleCloseReferral}>
                        <Shield className="h-3.5 w-3.5 mr-1.5" />
                        Close
                      </Button>
                    ) : (
                      <Badge variant="danger" size="sm">Action Required</Badge>
                    )}
                  </div>

                  {/* Completed Actions */}
                  {referral.status !== 'draft' && referral.status !== 'issued' && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Completed</h4>
                      <div className="space-y-1.5">
                        {referral.status !== 'acknowledged' && (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
                            <span className="text-slate-600">Referral acknowledged</span>
                          </div>
                        )}
                        {(referral.status === 'arrived' || referral.status === 'outcome_recorded' || referral.status === 'closed' || referral.status === 'back_referral_completed') && (
                          <div className="flex items-center gap-2 text-xs">
                            <User className="h-3.5 w-3.5 text-teal-600" />
                            <span className="text-slate-600">Patient arrived</span>
                          </div>
                        )}
                        {referral.status === 'outcome_recorded' && (
                          <div className="flex items-center gap-2 text-xs">
                            <Heart className="h-3.5 w-3.5 text-teal-600" />
                            <span className="text-slate-600">Outcome recorded</span>
                          </div>
                        )}
                        {referral.status === 'closed' && (
                          <div className="flex items-center gap-2 text-xs">
                            <Activity className="h-3.5 w-3.5 text-teal-600" />
                            <span className="text-slate-600">Referral closed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Missing Actions */}
                  {closureCheck.missing_actions && closureCheck.missing_actions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Missing Actions</h4>
                      <div className="space-y-1.5">
                        {closureCheck.missing_actions.map((action, idx) => {
                          const actionLabels = {
                            OUTCOME_NOT_RECORDED: 'Treatment outcome',
                            BACK_REFERRAL_PENDING: 'Back-referral',
                            FOLLOW_UP_PENDING: 'Follow-up task',
                          }
                          const actionIcons = {
                            OUTCOME_NOT_RECORDED: Heart,
                            BACK_REFERRAL_PENDING: Shield,
                            FOLLOW_UP_PENDING: Calendar,
                          }
                          const Icon = actionIcons[action] || AlertCircle
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                              <Icon className="h-3.5 w-3.5" />
                              <span>{actionLabels[action] || action}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Responsible Party */}
                  {(closureCheck.responsible_facility || closureCheck.responsible_role) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-amber-800 mb-1.5">Responsible Party</h4>
                      <div className="text-xs text-amber-700">
                        <p><span className="font-medium">Facility:</span> {closureCheck.responsible_facility || 'N/A'}</p>
                        <p><span className="font-medium">Role:</span> {closureCheck.responsible_role || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {closureCheck.explanation && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-slate-900 mb-1.5">Next Steps</h4>
                      <p className="text-xs text-slate-600">{closureCheck.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500">Loading closure check...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {(referral.status === 'issued' || referral.status === 'acknowledged') && (
          <Button onClick={() => navigate(`/hospital/arrival/${id}`)}>
            <User className="h-4 w-4" />
            Record Patient Arrival
          </Button>
        )}

        {referral.status === 'arrived' && (
          <Button onClick={() => navigate(`/outcomes/${id}`)}>
            <Heart className="h-4 w-4" />
            Record Treatment Outcome
          </Button>
        )}

        {!['closed', 'cancelled', 'rejected'].includes(referral.status) && (
          <Button variant="outline" onClick={() => navigate(`/back-referral/${id}`)}>
            <Shield className="h-4 w-4" />
            Create Back Referral
          </Button>
        )}

        <Button variant="outline" onClick={() => navigate(`/qr/${id}`)}>
          <FileText className="h-4 w-4" />
          View QR Reference
        </Button>

        {closureCheck?.eligible_for_closure && referral.status !== 'closed' && (
          <Button onClick={handleCloseReferral} variant="secondary">
            <ShieldCheck className="h-4 w-4" />
            Close Referral
          </Button>
        )}
      </div>
    </div>
  )
}