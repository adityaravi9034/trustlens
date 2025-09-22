'use client';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using TrustLens, you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily use TrustLens for content analysis purposes.
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose without authorization</li>
                <li>Attempt to reverse engineer any software contained on TrustLens</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Content Analysis Service</h2>
              <p className="text-gray-700 mb-4">
                TrustLens provides AI-powered content analysis for detecting manipulation, bias,
                and deception. While we strive for accuracy, the service is provided "as is"
                without warranties of any kind.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Privacy and Data</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also
                governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                You are responsible for safeguarding the password and for activities that occur
                under your account. You agree not to disclose your password to any third party.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Prohibited Uses</h2>
              <p className="text-gray-700 mb-4">
                You may not use our service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>For any unlawful purpose or to solicit others to unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
                <li>To impersonate or attempt to impersonate another user, person, or entity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and bar access to the service immediately,
                without prior notice or liability, under our sole discretion, for any reason whatsoever
                and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
                If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@trustlens.ai" className="text-trust-600 hover:text-trust-500">
                  legal@trustlens.ai
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}