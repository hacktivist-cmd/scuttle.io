import RevealWrapper from '../components/RevealWrapper'

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By using Scuttle.io, you agree to these Terms of Service. If you do not agree, please do not use our platform.' },
  { title: '2. Use of Service', body: 'Scuttle.io is an informational aggregator. We are not affiliated with any university or JAMB. The information provided is for general informational purposes only and should not be considered official advice.' },
  { title: '3. Accuracy of Information', body: 'While we strive for accuracy, Scuttle.io makes no warranties regarding the completeness or reliability of any information on the platform. Always verify admission lists and fees directly with the official university portal.' },
  { title: '4. Limitation of Liability', body: 'Scuttle.io shall not be liable for any damages arising from the use or inability to use our service, including but not limited to missed admission deadlines or incorrect information.' },
  { title: '5. Changes to Terms', body: 'We reserve the right to update these terms at any time. Continued use of the platform constitutes acceptance of the new terms.' },
]

export default function Terms() {
  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-12">
      <RevealWrapper>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">Terms of Service</h1>
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
