import { useState } from 'react'
import { Plus, Search, HelpCircle } from 'lucide-react'
import RevealWrapper from '../components/RevealWrapper'

const FAQS = [
  {
    q: 'How do I check my admission status?',
    a: 'Navigate to your specific university on the All Universities page, click on it to search its announcements, then click "Preview" to see the extracted PDF text. You can also click "Visit Original Source" to go directly to the university portal.',
  },
  {
    q: 'How does Scuttle.io work?',
    a: 'Our automated engine (Celery & Python) scans over 200 Federal, State, and Private university websites every 6 hours. It detects new announcements, categorizes them, extracts text from PDF admission lists, and updates this dashboard in real-time.',
  },
  {
    q: 'Is the information accurate?',
    a: 'Yes, we scrape directly from official university and JAMB portals. However, always double-check with the official source link provided in the modal, as universities sometimes make updates or corrections.',
  },
  {
    q: 'How do I join the WhatsApp channel?',
    a: 'Click the blue "Join Channel" button in the top right corner of the header. You will be redirected to our official WhatsApp broadcast channel where we send instant alerts for new admissions.',
  },
  {
    q: 'Can I request a university that is not listed?',
    a: 'Absolutely! Go to the "Report an Issue" page and select "Request a new institution". Our team reviews requests weekly and adds new institutions to our scraper.',
  },
]

export default function Help() {
  const [open, setOpen] = useState(0)

  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-12">
      <RevealWrapper>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-apple-blue mb-4">
            <HelpCircle size={26} />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            How can we help?
          </h1>
          <p className="text-apple-gray text-lg">
            Search our knowledge base or browse common questions below.
          </p>
        </div>
      </RevealWrapper>

      <RevealWrapper delay={100}>
        <div className="relative max-w-xl mx-auto mb-12">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search for answers..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-apple-blue text-sm shadow-sm transition-all duration-300"
          />
        </div>
      </RevealWrapper>

      <div className="space-y-4">
        {FAQS.map((faq, index) => {
          const isOpen = open === index
          return (
            <RevealWrapper key={index} delay={index * 60}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center font-medium hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <Plus
                    size={20}
                    className={`text-apple-blue transition-transform duration-500 flex-shrink-0 ml-4 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  />
                </button>
                <div
                  className={`px-6 text-apple-gray text-sm leading-relaxed transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                  } overflow-hidden`}
                >
                  {faq.a}
                </div>
              </div>
            </RevealWrapper>
          )
        })}
      </div>
    </div>
  )
}
