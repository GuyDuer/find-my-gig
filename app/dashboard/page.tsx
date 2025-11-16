"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ExternalLink, Briefcase, Building2, TrendingUp } from "lucide-react";

interface JobScore {
  is_relevant: boolean;
  match_score: number;
  reasoning: string;
  key_skills_matched: string[];
}

interface Company {
  id: string;
  name: string;
  website: string;
}

interface Job {
  id: string;
  title: string;
  url: string;
  location: string | null;
  description: string | null;
  first_seen_at: string;
  companies: Company;
  job_scores: JobScore[];
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'relevant'>('relevant');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs?relevant=${filter === 'relevant'}`);
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchScore = (job: Job): number => {
    const relevantScore = job.job_scores?.find(s => s.is_relevant);
    return relevantScore?.match_score || 0;
  };

  const isNewJob = (job: Job): boolean => {
    const seenDate = new Date(job.first_seen_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return seenDate > oneDayAgo;
  };

  const relevantJobs = jobs.filter(job => 
    job.job_scores?.some(s => s.is_relevant)
  );

  const newToday = jobs.filter(job => isNewJob(job)).length;

  const avgScore = relevantJobs.length > 0
    ? Math.round(relevantJobs.reduce((sum, job) => sum + getMatchScore(job), 0) / relevantJobs.length)
    : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track relevant job opportunities across Israeli tech companies
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relevant Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{relevantJobs.length}</div>
              <p className="text-xs text-muted-foreground">
                {newToday} new today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Match</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgScore}%</div>
              <p className="text-xs text-muted-foreground">
                Across all relevant jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(jobs.map(j => j.companies?.id)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                With active positions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Button
            variant={filter === 'relevant' ? 'default' : 'outline'}
            onClick={() => setFilter('relevant')}
          >
            Relevant Jobs
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Jobs
          </Button>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Job Opportunities</CardTitle>
            <CardDescription>
              {filter === 'relevant' 
                ? 'Jobs that match your profile'
                : 'All discovered job postings'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading jobs...
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No jobs found. Try running a scrape first.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const score = getMatchScore(job);
                    const relevantScore = job.job_scores?.find(s => s.is_relevant);
                    
                    return (
                      <TableRow 
                        key={job.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      >
                        <TableCell className="font-medium">
                          {job.companies?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md truncate">
                            {job.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.location || '-'}
                        </TableCell>
                        <TableCell>
                          {relevantScore && (
                            <Badge 
                              variant={score >= 80 ? 'default' : score >= 60 ? 'secondary' : 'outline'}
                            >
                              {score}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isNewJob(job) && (
                            <Badge variant="default">New</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Expanded Job Details */}
        {expandedJob && (() => {
          const job = jobs.find(j => j.id === expandedJob);
          if (!job) return null;
          
          const relevantScore = job.job_scores?.find(s => s.is_relevant);
          
          return (
            <Card>
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>
                  {job.companies?.name} • {job.location || 'Location not specified'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {relevantScore && (
                  <>
                    <div>
                      <h3 className="font-semibold mb-2">Match Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        {relevantScore.reasoning}
                      </p>
                    </div>
                    
                    {relevantScore.key_skills_matched?.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Matched Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {relevantScore.key_skills_matched.map((skill, idx) => (
                            <Badge key={idx} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {job.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {job.description.substring(0, 1000)}
                      {job.description.length > 1000 && '...'}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button>
                      View Full Job <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                  {job.companies?.website && (
                    <a
                      href={job.companies.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline">
                        Company Website
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </div>
  );
}

