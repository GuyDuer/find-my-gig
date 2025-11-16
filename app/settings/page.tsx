"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Play, Database, Mail } from "lucide-react";

export default function SettingsPage() {
  const [scraping, setScraping] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [scoring, setScoring] = useState(false);

  const runFullScrape = async () => {
    setScraping(true);
    try {
      const response = await fetch('/api/scrape');
      const data = await response.json();
      alert(`Scrape complete!\n\nCompanies: ${data.stats?.companiesProcessed || 0}\nJobs found: ${data.stats?.totalJobsFound || 0}\nNew jobs: ${data.stats?.totalJobsNew || 0}\nScored: ${data.stats?.totalJobsScored || 0}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Scrape failed. Check console for details.');
    } finally {
      setScraping(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      const response = await fetch('/api/send-digest');
      const data = await response.json();
      if (data.success) {
        alert('Test email sent successfully!');
      } else {
        alert(`Email failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send email. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your job scanner and manage data
          </p>
        </div>

        {/* CV Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CV
            </CardTitle>
            <CardDescription>
              Your CV is used to match and score job postings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Current CV: <span className="font-mono">source/guy_duer_cv.docx</span>
              </p>
              <Badge variant="outline">Configured</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              To update your CV, replace the file at source/guy_duer_cv.docx and re-score all jobs.
            </p>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Receive daily digests of new relevant jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input 
                type="email" 
                placeholder="your.email@example.com"
                className="mt-2"
              />
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={sendTestEmail}>
                Send Test Email
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure EMAIL_TO in your environment variables to receive automated digests.
            </p>
          </CardContent>
        </Card>

        {/* Manual Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Manual Operations
            </CardTitle>
            <CardDescription>
              Trigger scraping and scoring manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Full Scrape</h3>
              <p className="text-sm text-muted-foreground">
                Scrape all active companies, discover new jobs, and score them with AI
              </p>
              <Button 
                onClick={runFullScrape}
                disabled={scraping}
              >
                {scraping ? 'Scraping...' : 'Run Full Scrape'}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Discover Career Pages</h3>
              <p className="text-sm text-muted-foreground">
                Auto-discover career page URLs for companies without one
              </p>
              <Button 
                variant="outline"
                disabled={discovering}
                onClick={() => alert('This feature requires server-side execution. Use: npm run discover')}
              >
                {discovering ? 'Discovering...' : 'Discover Pages'}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Re-score All Jobs</h3>
              <p className="text-sm text-muted-foreground">
                Re-evaluate all active jobs (useful after CV update)
              </p>
              <Button 
                variant="outline"
                disabled={scoring}
                onClick={() => alert('This feature requires server-side execution. Use: npm run rescore')}
              >
                {scoring ? 'Scoring...' : 'Re-score Jobs'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
            <CardDescription>
              Import and manage your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Import Companies</h3>
              <p className="text-sm text-muted-foreground">
                Import companies from CSV: source/company_data.csv
              </p>
              <Button 
                variant="outline"
                onClick={() => alert('Run: npm run import-companies')}
              >
                Import from CSV
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Environment Variables</h3>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'default' : 'destructive'}>
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗'}
                  </Badge>
                  <span>NEXT_PUBLIC_SUPABASE_URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'default' : 'destructive'}>
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗'}
                  </Badge>
                  <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

