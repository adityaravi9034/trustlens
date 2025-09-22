'use client';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Us</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-gray-600 mb-6">
                Have questions about TrustLens? We're here to help. Reach out to our team
                and we'll get back to you as soon as possible.
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">General Inquiries</h3>
                  <p className="text-gray-600">
                    <a href="mailto:info@trustlens.ai" className="text-trust-600 hover:text-trust-500">
                      info@trustlens.ai
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Technical Support</h3>
                  <p className="text-gray-600">
                    <a href="mailto:support@trustlens.ai" className="text-trust-600 hover:text-trust-500">
                      support@trustlens.ai
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Legal & Privacy</h3>
                  <p className="text-gray-600">
                    <a href="mailto:legal@trustlens.ai" className="text-trust-600 hover:text-trust-500">
                      legal@trustlens.ai
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Business Partnerships</h3>
                  <p className="text-gray-600">
                    <a href="mailto:partnerships@trustlens.ai" className="text-trust-600 hover:text-trust-500">
                      partnerships@trustlens.ai
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trust-500 focus:border-trust-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trust-500 focus:border-trust-500"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trust-500 focus:border-trust-500"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trust-500 focus:border-trust-500"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-trust-600 text-white py-2 px-4 rounded-md hover:bg-trust-700 focus:outline-none focus:ring-2 focus:ring-trust-500 focus:ring-offset-2 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">How accurate is TrustLens analysis?</h3>
                <p className="text-gray-600 mt-1">
                  TrustLens uses advanced AI models to analyze content with high accuracy. However,
                  results should be used as guidance alongside your own judgment.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">What types of content can I analyze?</h3>
                <p className="text-gray-600 mt-1">
                  TrustLens can analyze news articles, social media posts, blogs, press releases,
                  and other text-based content for manipulation, bias, and credibility.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Is my analyzed content stored?</h3>
                <p className="text-gray-600 mt-1">
                  Analysis results are stored temporarily for your session history. We do not
                  permanently store your content. See our Privacy Policy for details.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Can I integrate TrustLens into my application?</h3>
                <p className="text-gray-600 mt-1">
                  Yes! We offer API access for developers and enterprises. Contact our partnerships
                  team to learn more about integration options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}