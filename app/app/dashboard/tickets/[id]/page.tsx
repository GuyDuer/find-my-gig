'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

interface Ticket {
  id: string;
  status: string;
  userToJobScore: number;
  jobToUserScore: number;
  overallScore: number;
  scoringExplanation: string;
  tags: string[];
  createdAt: string;
  submittedAt: string | null;
  job: {
    title: string;
    company: string;
    description: string;
    locations: string[];
    roleTags: string[];
    workMode: string | null;
    url: string | null;
  };
  artifacts: Array<{
    id: string;
    type: string;
    fileName: string;
  }>;
}

export default function TicketDetailPage() {
  const params = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${params.id}`);
      const data = await response.json();
      setTicket(data.ticket);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateArtifacts = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/tickets/${params.id}/generate-artifacts`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchTicket(); // Refresh to show new artifacts
      }
    } catch (error) {
      console.error('Failed to generate artifacts:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadArtifact = (artifactId: string) => {
    window.open(`/api/artifacts/${artifactId}/download`, '_blank');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!ticket) {
    return <div className="flex items-center justify-center h-64">Ticket not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          ← Back to Board
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Job Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{ticket.job.title}</CardTitle>
                <p className="text-lg text-gray-600 mt-1">{ticket.job.company}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(ticket.overallScore)}
                </div>
                <div className="text-xs text-gray-500">Overall Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {ticket.tags.map((tag, idx) => (
                <Badge key={idx} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">User → Job Fit:</span>
                <span className="ml-2 font-semibold">{Math.round(ticket.userToJobScore)}</span>
              </div>
              <div>
                <span className="text-gray-500">Job → User Fit:</span>
                <span className="ml-2 font-semibold">{Math.round(ticket.jobToUserScore)}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-semibold">{ticket.status}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{formatDateTime(ticket.createdAt)}</span>
              </div>
            </div>

            {ticket.job.locations.length > 0 && (
              <div className="mt-4">
                <span className="text-gray-500">📍 </span>
                {ticket.job.locations.join(', ')}
              </div>
            )}

            {ticket.job.workMode && (
              <div className="mt-2">
                <Badge variant="secondary">{ticket.job.workMode}</Badge>
              </div>
            )}

            {ticket.job.url && (
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href={ticket.job.url} target="_blank" rel="noopener noreferrer">
                    View Original Posting →
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scoring Explanation */}
        <Card>
          <CardHeader>
            <CardTitle>Fit Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {ticket.scoringExplanation}
            </p>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {ticket.job.description}
            </div>
          </CardContent>
        </Card>

        {/* Artifacts */}
        <Card>
          <CardHeader>
            <CardTitle>Application Materials</CardTitle>
          </CardHeader>
          <CardContent>
            {ticket.artifacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  No application materials generated yet
                </p>
                <Button onClick={generateArtifacts} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate CV & Cover Letter'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {ticket.artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{artifact.fileName}</div>
                      <div className="text-xs text-gray-500">{artifact.type}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadArtifact(artifact.id)}
                    >
                      Download
                    </Button>
                  </div>
                ))}
                <div className="pt-4">
                  <Button variant="secondary" onClick={generateArtifacts} disabled={generating}>
                    {generating ? 'Regenerating...' : 'Regenerate Materials'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

