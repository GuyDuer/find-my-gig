'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  company: string;
  locations: string[];
  roleTags: string[];
  url: string | null;
}

interface Ticket {
  id: string;
  status: string;
  userToJobScore: number;
  jobToUserScore: number;
  overallScore: number;
  tags: string[];
  createdAt: string;
  job: Job;
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Record<string, Ticket[]>>({
    IDENTIFIED: [],
    SUBMITTED: [],
    REJECTED: [],
    WONT_GO_AFTER: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets');
      const data = await response.json();

      const grouped: Record<string, Ticket[]> = {
        IDENTIFIED: [],
        SUBMITTED: [],
        REJECTED: [],
        WONT_GO_AFTER: [],
      };

      data.tickets.forEach((ticket: Ticket) => {
        grouped[ticket.status].push(ticket);
      });

      setTickets(grouped);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTickets();
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getTagVariant = (tag: string) => {
    if (tag.includes('Match')) return 'success';
    if (tag.includes('High Fit')) return 'success';
    if (tag.includes('Stretch')) return 'warning';
    if (tag.includes('Left Field')) return 'purple';
    return 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const columns = [
    { key: 'IDENTIFIED', title: 'Identified', color: 'border-blue-500' },
    { key: 'SUBMITTED', title: 'Submitted', color: 'border-green-500' },
    { key: 'REJECTED', title: 'Rejected', color: 'border-red-500' },
    { key: 'WONT_GO_AFTER', title: "Won't Go After", color: 'border-gray-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Board</h1>
        <p className="text-gray-600">Manage your job opportunities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.key} className="flex flex-col">
            <div className={`bg-white rounded-lg border-t-4 ${column.color} p-4 mb-4 shadow-sm`}>
              <h2 className="font-semibold text-lg">
                {column.title}
                <span className="ml-2 text-sm text-gray-500">
                  ({tickets[column.key].length})
                </span>
              </h2>
            </div>

            <div className="space-y-4 flex-1">
              {tickets[column.key].map((ticket) => (
                <Card key={ticket.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {ticket.job.title}
                    </h3>
                    <p className="text-sm text-gray-600">{ticket.job.company}</p>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Score:</span>
                      <div
                        className={`${getScoreColor(ticket.overallScore)} text-white text-xs font-bold px-2 py-1 rounded`}
                      >
                        {Math.round(ticket.overallScore)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {ticket.tags.map((tag, idx) => (
                        <Badge key={idx} variant={getTagVariant(tag)}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {ticket.job.locations.length > 0 && (
                      <p className="text-xs text-gray-500">
                        📍 {ticket.job.locations.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 mb-3">
                    {formatDate(ticket.createdAt)}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex-1"
                      onClick={() => window.open(`/dashboard/tickets/${ticket.id}`, '_blank')}
                    >
                      View
                    </Button>

                    {column.key === 'IDENTIFIED' && (
                      <Button
                        size="sm"
                        className="text-xs flex-1"
                        onClick={() => updateTicketStatus(ticket.id, 'SUBMITTED')}
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                </Card>
              ))}

              {tickets[column.key].length === 0 && (
                <div className="text-center text-gray-400 py-8 text-sm">
                  No jobs in this column
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

