'use client';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Powerful Features for Content Analysis
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              TrustLens combines advanced AI with proven detection methods to help you identify
              manipulation, bias, and deception in digital content.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-trust-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-600">
              Advanced machine learning models analyze content for patterns of manipulation,
              bias, and deception with high accuracy.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-trust-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Processing</h3>
            <p className="text-gray-600">
              Get instant analysis results as you paste or upload content. No waiting,
              no delays - just immediate insights.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-trust-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Scoring</h3>
            <p className="text-gray-600">
              Multi-dimensional analysis covering manipulation, bias, deception, clickbait,
              misinformation, and emotional framing.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-trust-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h10a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V3m0 2h10m-5 3v6m0 0l-3-3m3 3l3-3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Explanations</h3>
            <p className="text-gray-600">
              Understand why content received certain scores with detailed explanations
              and specific examples of detected patterns.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-trust-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fact Checking</h3>
            <p className="text-gray-600">
              Automated fact verification helps identify potentially false or misleading
              claims within analyzed content.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-trust-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-trust-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis History</h3>
            <p className="text-gray-600">
              Keep track of all your analyses with a browsable history. Review past
              results and track patterns over time.
            </p>
          </div>

        </div>

        <div className="mt-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Detection Categories
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border-l-4 border-trust-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Manipulation Detection</h3>
                  <p className="text-gray-600 text-sm">
                    Identifies deliberate attempts to mislead through selective information,
                    emotional manipulation, or logical fallacies.
                  </p>
                </div>

                <div className="border-l-4 border-trust-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Bias Analysis</h3>
                  <p className="text-gray-600 text-sm">
                    Detects political, cultural, or ideological bias that may skew
                    the presentation of information.
                  </p>
                </div>

                <div className="border-l-4 border-trust-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Deception Indicators</h3>
                  <p className="text-gray-600 text-sm">
                    Analyzes language patterns and structural elements that commonly
                    appear in deceptive content.
                  </p>
                </div>

                <div className="border-l-4 border-trust-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Clickbait Detection</h3>
                  <p className="text-gray-600 text-sm">
                    Identifies sensationalized headlines and content designed primarily
                    to generate clicks rather than inform.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-trust-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Misinformation Screening</h3>
                  <p className="text-gray-600 text-sm">
                    Flags content that contains potentially false or misleading information
                    based on known patterns and fact-checking databases.
                  </p>
                </div>

                <div className="border-l-4 border-trust-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Fear Framing</h3>
                  <p className="text-gray-600 text-sm">
                    Detects excessive use of fear-based language designed to provoke
                    emotional responses rather than rational analysis.
                  </p>
                </div>

                <div className="border-l-4 border-trust-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Loaded Language</h3>
                  <p className="text-gray-600 text-sm">
                    Identifies emotionally charged words and phrases that may be used
                    to influence opinion rather than present facts.
                  </p>
                </div>

                <div className="border-l-4 border-trust-500 pl-4">
                  <h3 className="font-semibold text-gray-900">Source Credibility</h3>
                  <p className="text-gray-600 text-sm">
                    Evaluates the reliability and trustworthiness of sources cited
                    or referenced in the content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-trust-600 to-trust-700 rounded-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-6">
              Start analyzing content today and make more informed decisions about the information you consume.
            </p>
            <a
              href="/"
              className="inline-block bg-white text-trust-600 font-semibold py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Try TrustLens Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}