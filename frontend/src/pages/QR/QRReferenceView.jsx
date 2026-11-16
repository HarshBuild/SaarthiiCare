import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileDown, Printer, ArrowLeft, Copy, CheckCircle } from 'lucide-react'
import QRCode from 'qrcode'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { ReferralDetailsClient } from '../../services/referralsService'

export default function QRReferenceView() {
  const { referralId } = useParams()
  const toast = useToast()
  const [referral, setReferral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

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

  // Generate a real, scannable QR code that deep-links to this referral.
  useEffect(() => {
    if (!referral?.id) return

    const payload = `${window.location.origin}/referrals/${referral.id}`
    let cancelled = false

    QRCode.toDataURL(payload, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })

    return () => {
      cancelled = true
    }
  }, [referral])

  const handleCopyReferralNumber = async () => {
    if (!referral?.referral_number) return
    try {
      await navigator.clipboard.writeText(referral.referral_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Clipboard access is unavailable in this browser.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!qrDataUrl) {
      toast.error('QR code is still being generated. Please try again in a moment.')
      return
    }

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `saarthii-${referral.referral_number || referral.id}-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('QR code downloaded as a PNG image.', 'Download ready')
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
          <h1 className="text-2xl font-bold text-slate-900">QR Reference</h1>
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
        <Link to={`/referrals/${referralId}`}>
          <Button>Back to Referral</Button>
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
        <h1 className="text-2xl font-bold text-slate-900">QR Reference Card</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <Card>
          <CardHeader>
            <CardTitle>Referral QR Code</CardTitle>
            <CardDescription>
              Scan to open this referral on any device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for referral ${referral.referral_number}`}
                    className="h-56 w-56"
                  />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center text-sm text-slate-400">
                    Generating QR code…
                  </div>
                )}
              </div>
              <p className="mt-3 font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {referral.referral_number}
              </p>

              {/* Referral Number with Copy */}
              <div className="mt-6 w-full max-w-sm">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Referral Number</p>
                    <p className="font-mono text-sm font-medium text-slate-900">
                      {referral.referral_number}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyReferralNumber}
                    className="ml-2"
                    aria-label="Copy referral number"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Information */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
            <CardDescription>
              Quick reference for printing and sharing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Patient Name</p>
                  <p className="font-medium text-slate-900">{referral.patient_name || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Specialty</p>
                  <p className="font-medium text-slate-900">
                    {referral.specialty?.replace(/_/g, ' ') || 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Receiving Facility</p>
                  <p className="font-medium text-slate-900">
                    {referral.receiving_facility_name || 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <Badge variant="teal">{referral.status?.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 sm:col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Referral ID</p>
                  <p className="font-mono text-sm text-slate-900">{referral.id}</p>
                </div>
              </div>

              {referral.reason && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Reason for Referral</p>
                  <div className="bg-slate-100 rounded-xl p-3 border border-slate-200">
                    <p className="text-sm text-slate-700">{referral.reason}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <Button onClick={handleDownload} disabled={!qrDataUrl}>
          <FileDown className="h-4 w-4 mr-2" />
          Download QR Code
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print Reference
        </Button>
        <Link to={`/referrals/${referralId}`} className="sm:ml-auto">
          <Button variant="secondary">
            Back to Referral
          </Button>
        </Link>
      </div>
    </div>
  )
}
