"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, Play, ExternalLink } from "lucide-react";

interface Company {
  id: string;
  name: string;
  website: string | null;
  career_page_url: string | null;
  career_page_type: string | null;
  discovery_status: string | null;
  last_discovery_attempt: string | null;
  active: boolean;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scraping, setScraping] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/companies');
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrapeCompany = async (companyId: string) => {
    setScraping(companyId);
    try {
      const response = await fetch(`/api/scrape?company_id=${companyId}`);
      const data = await response.json();
      console.log('Scrape result:', data);
      alert(`Scrape complete! Found ${data.stats?.totalJobsFound || 0} jobs.`);
      fetchCompanies(); // Refresh
    } catch (error) {
      console.error('Error scraping:', error);
      alert('Scrape failed. Check console for details.');
    } finally {
      setScraping(null);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: companies.length,
    withCareerPage: companies.filter(c => c.career_page_url).length,
    active: companies.filter(c => c.active).length,
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground mt-2">
            Manage company career pages and trigger scrapes
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">With Career Page</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withCareerPage}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.withCareerPage / stats.total) * 100)}% coverage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex gap-4">
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Button
            onClick={() => window.location.href = '/settings'}
          >
            Import Companies
          </Button>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Company List</CardTitle>
            <CardDescription>
              {filteredCompanies.length} companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading companies...
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No companies found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Career Page</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{company.name}</div>
                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {company.website.replace('https://', '').replace('http://', '')}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.career_page_url ? (
                          <a
                            href={company.career_page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs hover:underline flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Found
                          </a>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <XCircle className="h-4 w-4" />
                            Not found
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.career_page_type && (
                          <Badge variant="outline" className="capitalize">
                            {company.career_page_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.discovery_status === 'found' && (
                          <Badge variant="default">Discovered</Badge>
                        )}
                        {company.discovery_status === 'not_found' && (
                          <Badge variant="secondary">Not Found</Badge>
                        )}
                        {company.discovery_status === 'error' && (
                          <Badge variant="destructive">Error</Badge>
                        )}
                        {!company.discovery_status && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scrapeCompany(company.id)}
                          disabled={!company.career_page_url || scraping === company.id}
                        >
                          {scraping === company.id ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Scraping...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Scrape Now
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

