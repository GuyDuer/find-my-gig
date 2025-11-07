import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-6xl font-bold mb-6">
            Find My Gig
          </h1>
          <p className="text-2xl mb-4 opacity-90">
            AI-Powered Job Search & Application Assistant
          </p>
          <p className="text-xl mb-12 opacity-80">
            Automate your job search, score opportunities, and generate tailored applications
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Daily Job Discovery</h3>
              <p className="opacity-80">
                Automated scanning of relevant job opportunities based on your preferences
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Smart Fit Scoring</h3>
              <p className="opacity-80">
                Dual scoring system: How you fit the job + How the job fits you
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">Tailored Applications</h3>
              <p className="opacity-80">
                AI-generated CVs and cover letters customized for each role
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Kanban Tracking</h3>
              <p className="opacity-80">
                Organize opportunities from identified to submitted
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-semibold mb-2">Daily Digests</h3>
              <p className="opacity-80">
                Email notifications with new high-fit opportunities
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-2">Insights Dashboard</h3>
              <p className="opacity-80">
                Analytics on your job search progress and trends
              </p>
            </div>
          </div>

          <div className="mt-20 bg-white/10 backdrop-blur-lg p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <div className="space-y-4 text-left max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div>
                  <h4 className="font-semibold mb-1">Upload Your CV & Set Preferences</h4>
                  <p className="opacity-80 text-sm">Define your target roles, locations, and companies</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div>
                  <h4 className="font-semibold mb-1">Daily Job Scanning</h4>
                  <p className="opacity-80 text-sm">AI agent discovers and scores opportunities while you sleep</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div>
                  <h4 className="font-semibold mb-1">Review & Apply</h4>
                  <p className="opacity-80 text-sm">Generate tailored CVs and cover letters with one click</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div>
                  <h4 className="font-semibold mb-1">Track Progress</h4>
                  <p className="opacity-80 text-sm">Manage applications on your Kanban board and get insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
