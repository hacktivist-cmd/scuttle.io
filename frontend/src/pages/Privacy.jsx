import RevealWrapper from '../components/RevealWrapper'

const SECTIONS = [
  { title: '1. Information We Collect', body: 'Scuttle.io aggregates publicly available information from Nigerian university and JAMB websites. We do not collect personal data from students unless voluntarily provided (e.g., through our contact forms or WhatsApp channel).' },
  { title: '2. How We Use Information', body: 'The scraped public announcements are used solely to inform students about admissions, Post-UTME screenings, and academic calendars. We do not sell or share this data with third parties.' },
  { title: '3. Data Security', body: 'We implement industry-standard security measures to protect our database. However, we cannot guarantee absolute security as the data is aggregated from public sources.' },
  { title: '4. Third-Party Links', body: 'Our platform contains links to external university portals. We are not responsible for the privacy practices or content of these third-party sites.' },
  { title: '5. Contact Us', body: 'If you have any questions about this Privacy Policy, please contact us via our Contact Us page.' },
]

export default function Privacy() {
  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-12">
      <RevealWrapper>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">Privacy Policy</h1>
      </RevealWrapper>
      <RevealWrapper delay={100}>
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-apple border border-gray-100 space-y-6 text-apple-gray leading-relaxed text-sm md:text-base">
          <p className="italic">Last updated: January 2026</p>
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <h2 className="text-xl font-semibold text-apple-dark pt-4 mb-2">{s.title}</h2>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </RevealWrapper>
    </div>
  )
}
