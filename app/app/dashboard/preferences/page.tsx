'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PreferenceSet {
  id: string;
  name: string;
  active: boolean;
  roles: string[];
  locations: string[];
  companies: string[];
}

const AVAILABLE_ROLES = [
  'RevOps',
  'BizOps',
  'CX Ops',
  'GTM Ops',
  'Strategy & Ops',
  'Sales Ops',
  'Chief of Staff',
  'Product Ops',
  'Data Ops',
  'Marketing Ops',
];

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<PreferenceSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    roles: [] as string[],
    locations: [] as string[],
    companies: [] as string[],
  });
  const [newLocation, setNewLocation] = useState('');
  const [newCompany, setNewCompany] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/preferences');
      const data = await response.json();
      setPreferences(data.preferences);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPreference = async () => {
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, active: true }),
      });

      if (response.ok) {
        fetchPreferences();
        setShowForm(false);
        setFormData({ name: '', roles: [], locations: [], companies: [] });
      }
    } catch (error) {
      console.error('Failed to create preference:', error);
    }
  };

  const togglePreference = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/preferences/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      fetchPreferences();
    } catch (error) {
      console.error('Failed to toggle preference:', error);
    }
  };

  const deletePreference = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preference set?')) return;
    
    try {
      await fetch(`/api/preferences/${id}`, { method: 'DELETE' });
      fetchPreferences();
    } catch (error) {
      console.error('Failed to delete preference:', error);
    }
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const addLocation = () => {
    if (newLocation && !formData.locations.includes(newLocation)) {
      setFormData((prev) => ({ ...prev, locations: [...prev.locations, newLocation] }));
      setNewLocation('');
    }
  };

  const removeLocation = (loc: string) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l !== loc),
    }));
  };

  const addCompany = () => {
    if (newCompany && !formData.companies.includes(newCompany)) {
      setFormData((prev) => ({ ...prev, companies: [...prev.companies, newCompany] }));
      setNewCompany('');
    }
  };

  const removeCompany = (comp: string) => {
    setFormData((prev) => ({
      ...prev,
      companies: prev.companies.filter((c) => c !== comp),
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Preferences</h1>
          <p className="text-gray-600">Manage your job search preferences (max 3 sets)</p>
        </div>
        {preferences.length < 3 && !showForm && (
          <Button onClick={() => setShowForm(true)}>Add Preference Set</Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Preference Set</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="e.g., Primary Search"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Roles</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      formData.roles.includes(role)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Locations</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add location"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                />
                <Button onClick={addLocation}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.locations.map((loc) => (
                  <Badge key={loc} variant="secondary">
                    {loc}{' '}
                    <button onClick={() => removeLocation(loc)} className="ml-1">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">High-Interest Companies</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add company"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCompany()}
                />
                <Button onClick={addCompany}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.companies.map((comp) => (
                  <Badge key={comp} variant="secondary">
                    {comp}{' '}
                    <button onClick={() => removeCompany(comp)} className="ml-1">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createPreference}>Save</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {preferences.map((pref) => (
          <Card key={pref.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{pref.name}</h3>
                  <div className="mt-1">
                    <Badge variant={pref.active ? 'success' : 'secondary'}>
                      {pref.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePreference(pref.id, pref.active)}
                  >
                    {pref.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePreference(pref.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Roles</div>
                  <div className="flex flex-wrap gap-2">
                    {pref.roles.map((role) => (
                      <Badge key={role}>{role}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Locations</div>
                  <div className="flex flex-wrap gap-2">
                    {pref.locations.map((loc) => (
                      <Badge key={loc} variant="secondary">
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>

                {pref.companies.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      High-Interest Companies
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pref.companies.map((comp) => (
                        <Badge key={comp} variant="purple">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {preferences.length === 0 && !showForm && (
        <div className="text-center text-gray-500 py-12">
          <p className="mb-4">No preference sets yet</p>
          <Button onClick={() => setShowForm(true)}>Create Your First Set</Button>
        </div>
      )}
    </div>
  );
}

