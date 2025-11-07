'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScanConfig {
  enabled: boolean;
  threshold: number;
  snoozeUntil: string | null;
  lastScanAt: string | null;
  nextScanAt: string | null;
}

export default function SettingsPage() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [hasCV, setHasCV] = useState(false);
  
  const [scanConfig, setScanConfig] = useState<ScanConfig | null>(null);
  const [threshold, setThreshold] = useState(65);
  const [snoozeDays, setSnoozeDays] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkCV();
    fetchScanConfig();
  }, []);

  const checkCV = async () => {
    try {
      const response = await fetch('/api/cv/upload');
      if (response.ok) {
        setHasCV(true);
      }
    } catch (error) {
      console.error('Failed to check CV:', error);
    }
  };

  const fetchScanConfig = async () => {
    try {
      const response = await fetch('/api/settings/scan-config');
      const data = await response.json();
      setScanConfig(data.scanConfig);
      setThreshold(data.scanConfig.threshold);
    } catch (error) {
      console.error('Failed to fetch scan config:', error);
    }
  };

  const handleCVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) return;

    setUploading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', cvFile);

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadSuccess(true);
        setHasCV(true);
        setCvFile(null);
      }
    } catch (error) {
      console.error('Failed to upload CV:', error);
    } finally {
      setUploading(false);
    }
  };

  const updateScanConfig = async (updates: Partial<ScanConfig>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/scan-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchScanConfig();
      }
    } catch (error) {
      console.error('Failed to update scan config:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleScanning = () => {
    if (scanConfig) {
      updateScanConfig({ enabled: !scanConfig.enabled });
    }
  };

  const updateThreshold = () => {
    updateScanConfig({ threshold });
  };

  const snoozeScanning = () => {
    if (snoozeDays > 0) {
      const snoozeUntil = new Date();
      snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays);
      updateScanConfig({ snoozeUntil: snoozeUntil.toISOString() });
    }
  };

  const unsnooze = () => {
    updateScanConfig({ snoozeUntil: null });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your CV and scan configuration</p>
      </div>

      <div className="space-y-6">
        {/* CV Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Base CV</CardTitle>
            <CardDescription>
              Upload your base CV (DOCX format). This will be used to generate tailored applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasCV && (
              <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">
                ✓ CV uploaded successfully
              </div>
            )}

            <form onSubmit={handleCVUpload} className="space-y-4">
              <div>
                <Input
                  type="file"
                  accept=".docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Only .docx files are supported
                </p>
              </div>

              <Button type="submit" disabled={!cvFile || uploading}>
                {uploading ? 'Uploading...' : hasCV ? 'Update CV' : 'Upload CV'}
              </Button>

              {uploadSuccess && (
                <div className="text-sm text-green-600">
                  CV uploaded successfully!
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Scan Configuration */}
        {scanConfig && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Job Scanning</CardTitle>
                <CardDescription>
                  Control when and how the system scans for new job opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Daily Job Scanning</div>
                    <div className="text-sm text-gray-500">
                      {scanConfig.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <Button onClick={toggleScanning} disabled={saving}>
                    {scanConfig.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>

                {scanConfig.lastScanAt && (
                  <div className="text-sm text-gray-600">
                    Last scan: {new Date(scanConfig.lastScanAt).toLocaleString()}
                  </div>
                )}

                {scanConfig.nextScanAt && (
                  <div className="text-sm text-gray-600">
                    Next scan: {new Date(scanConfig.nextScanAt).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Threshold</CardTitle>
                <CardDescription>
                  Minimum overall score (0-100) to create a ticket
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-32"
                  />
                  <Button onClick={updateThreshold} disabled={saving}>
                    Update
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Current threshold: {scanConfig.threshold}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Snooze Mode</CardTitle>
                <CardDescription>
                  Temporarily pause job scanning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scanConfig.snoozeUntil && new Date(scanConfig.snoozeUntil) > new Date() ? (
                  <div>
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md mb-4">
                      Scanning is snoozed until{' '}
                      {new Date(scanConfig.snoozeUntil).toLocaleDateString()}
                    </div>
                    <Button onClick={unsnooze} disabled={saving}>
                      Un-snooze
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        placeholder="Days"
                        value={snoozeDays || ''}
                        onChange={(e) => setSnoozeDays(Number(e.target.value))}
                        className="w-32"
                      />
                      <Button onClick={snoozeScanning} disabled={!snoozeDays || saving}>
                        Snooze for {snoozeDays} day{snoozeDays !== 1 ? 's' : ''}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Enter number of days to pause scanning
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

