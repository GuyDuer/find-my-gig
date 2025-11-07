'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Insights {
  newRolesToday: number;
  avgFit7Days: number;
  topCompanies: Array<{ company: string; count: number }>;
  topTitles: Array<{ title: string; avgScore: number; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  dailyTickets: Array<{ date: string; count: number }>;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/insights');
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading insights...</div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No insights available</div>
      </div>
    );
  }

  const maxDailyCount = Math.max(...insights.dailyTickets.map((d) => d.count), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Insights</h1>
        <p className="text-gray-600">Analytics on your job search</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {insights.newRolesToday}
              </div>
              <div className="text-sm text-gray-600 mt-2">New Roles Today</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">
                {insights.avgFit7Days}
              </div>
              <div className="text-sm text-gray-600 mt-2">Avg Fit (7 days)</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">
                {insights.statusDistribution.reduce((sum, s) => sum + s.count, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-2">Total Active Jobs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.dailyTickets.map((day) => (
                <div key={day.date}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-semibold">{day.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(day.count / maxDailyCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.statusDistribution.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{status.status}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(status.count / insights.statusDistribution.reduce((sum, s) => sum + s.count, 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-semibold w-8 text-right">{status.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Top Companies (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.topCompanies.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No data yet</div>
            ) : (
              <div className="space-y-3">
                {insights.topCompanies.map((company, idx) => (
                  <div
                    key={company.company}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-gray-400">#{idx + 1}</div>
                      <span className="text-sm">{company.company}</span>
                    </div>
                    <span className="font-semibold text-blue-600">{company.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Titles */}
        <Card>
          <CardHeader>
            <CardTitle>Top Titles (≥80 Score)</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.topTitles.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No data yet</div>
            ) : (
              <div className="space-y-3">
                {insights.topTitles.map((title, idx) => (
                  <div key={title.title} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{title.title}</span>
                      <span className="text-sm font-semibold text-green-600">
                        {Math.round(title.avgScore)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {title.count} opportunity{title.count !== 1 ? 'ies' : 'y'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

