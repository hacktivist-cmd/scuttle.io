import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Mail, Calendar, Check, Loader2,
  Star, Bell, BellOff, Search, Sparkles,
  FileText, GraduationCap, BarChart3, Wallet,
  ClipboardList, CalendarDays, Newspaper, Building2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { universitiesData } from '../data/universities'

const CATEGORIES = [
  { key: 'Post-UTME', label: 'Post-UTME', icon: FileText, color: 'blue' },
  { key: 'Admission List', label: 'Admission Lists', icon: GraduationCap, color: 'green' },
  { key: 'JAMB CAPS', label: 'JAMB CAPS', icon: BarChart3, color: 'purple' },
  { key: 'School Fees', label: 'School Fees', icon: Wallet, color: 'amber' },
  { key: 'JAMB Registration', label: 'JAMB Registration', icon: ClipboardList, color: 'indigo' },
  { key: 'Academic Calendar', label: 'Academic Calendar', icon: CalendarDays, color: 'rose' },
  { key: 'General News', label: 'General News', icon: Newspaper, color: 'gray' },
]

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    ring: 'border-blue-200',    soft: 'bg-blue-100' },
  green:   { bg: 'bg-green-50',   text: 'text-green-600',   ring: 'border-green-200',   soft: 'bg-green-100' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  ring: 'border-purple-200',  soft: 'bg-purple-100' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   ring: 'border-amber-200',   soft: 'bg-amber-100' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  ring: 'border-indigo-200',  soft: 'bg-indigo-100' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    ring: 'border-rose-200',    soft: 'bg-rose-100' },
  gray:    { bg: 'bg-gray-100',   text: 'text-gray-600',    ring: 'border-gray-200',    soft: 'bg-gray-200' },
}

export default function Profile() {
  const { user, profile, updateUserProfile } = useAuth()
  const navigate = useNavigate()

  const [interests, setInterests] = useState([])
  const [followedUniversities, setFollowedUniversities] = useState([])
  const [newsletterEnabled, setNewsletterEnabled] = useState(true)
  const [uniSearch, setUniSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setInterests(profile.interests || [])
      setFollowedUniversities(profile.followedUniversities || [])
      setNewsletterEnabled(profile.newsletterEnabled !== false)
    }
  }, [profile])

  const toggleInterest = (key) => {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleUniversity = (code) => {
    setFollowedUniversities((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    await updateUserProfile({
      interests,
      followedUniversities,
      newsletterEnabled,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const filteredUnis = uniSearch
    ? universitiesData.filter(
        (u) =>
          u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
          u.code.toLowerCase().includes(uniSearch.toLowerCase())
      )
    : universitiesData.slice(0, 12)

  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-apple-blue text-sm font-medium mb-8 hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-apple-blue to-blue-700 text-white flex items-center justify-center text-3xl font-semibold overflow-hidden shadow-lg shadow-blue-500/20">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              (profile?.name || user?.email)?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight mb-1">
              {profile?.name || 'User'}
            </h1>
            <p className="text-apple-gray text-sm flex items-center gap-1.5 mb-3">
              <Mail size={14} /> {user?.email}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] text-apple-gray bg-apple-bg px-3 py-1 rounded-full flex items-center gap-1.5 font-medium">
                <Calendar size={11} />
                Joined {profile?.createdAt?.toDate?.().toLocaleDateString() || 'Today'}
              </span>
              <span className="text-[11px] text-apple-blue bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium">
                <Star size={11} /> {interests.length} interests
              </span>
              <span className="text-[11px] text-purple-700 bg-purple-50 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium">
                <GraduationCap size={11} /> Following {followedUniversities.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">What are you interested in?</h2>
            <p className="text-sm text-apple-gray">
              We'll prioritize these categories in your personal feed and alerts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map(({ key, label, icon: Icon, color }) => {
            const active = interests.includes(key)
            const c = COLOR_MAP[color]
            return (
              <motion.button
                key={key}
                onClick={() => toggleInterest(key)}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  active
                    ? 'border-apple-blue bg-blue-50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    active ? 'bg-apple-blue text-white' : `${c.bg} ${c.text}`
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span className={`flex-1 text-sm font-medium ${active ? 'text-apple-blue' : 'text-apple-dark'}`}>
                  {label}
                </span>
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-apple-blue flex items-center justify-center"
                  >
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Follow Universities */}
      <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Follow Universities</h2>
            <p className="text-sm text-apple-gray">
              Get instant alerts for the schools you care about. {followedUniversities.length} selected.
            </p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none"
          />
          <input
            type="text"
            value={uniSearch}
            onChange={(e) => setUniSearch(e.target.value)}
            placeholder="Search 200+ universities..."
            className="w-full pl-11 pr-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all"
          />
        </div>

        {followedUniversities.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-purple-50 border border-purple-100">
            <p className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wider">
              Following ({followedUniversities.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {followedUniversities.map((code) => (
                <button
                  key={code}
                  onClick={() => toggleUniversity(code)}
                  className="text-[11px] bg-white text-purple-700 px-2.5 py-1 rounded-full border border-purple-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-medium"
                >
                  {code} ×
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
          {filteredUnis.map((uni) => {
            const active = followedUniversities.includes(uni.code)
            return (
              <button
                key={uni.code}
                onClick={() => toggleUniversity(uni.code)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                  active
                    ? 'border-purple-200 bg-purple-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                    active ? 'bg-purple-600 text-white' : 'bg-apple-bg text-apple-dark'
                  }`}
                >
                  {uni.code.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold truncate ${
                      active ? 'text-purple-700' : 'text-apple-dark'
                    }`}
                  >
                    {uni.name}
                  </p>
                  <p className="text-[10px] text-apple-gray">{uni.code}</p>
                </div>
                {active && <Check size={14} className="text-purple-600 flex-shrink-0" strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Newsletter Toggle */}
      <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                newsletterEnabled ? 'bg-green-50' : 'bg-gray-100'
              }`}
            >
              {newsletterEnabled ? (
                <Bell size={20} className="text-green-600" />
              ) : (
                <BellOff size={20} className="text-apple-gray" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Newsletter & Alerts</h2>
              <p className="text-sm text-apple-gray leading-relaxed">
                {newsletterEnabled
                  ? 'You\'ll receive emails and WhatsApp alerts when new announcements match your interests.'
                  : 'You won\'t receive any emails or alerts. You can turn this back on anytime.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setNewsletterEnabled((v) => !v)}
            className={`relative w-14 h-8 rounded-full transition-colors duration-300 flex-shrink-0 ${
              newsletterEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <motion.span
              animate={{ x: newsletterEnabled ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 rounded-2xl font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2 ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-apple-blue hover:bg-blue-600 text-white'
        } disabled:opacity-50`}
      >
        {saving ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Saving...
          </>
        ) : saved ? (
          <>
            <Check size={18} strokeWidth={3} /> Saved!
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  )
}
