'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Estimation } from '@/lib/supabase';

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [fundName, setFundName] = useState('');
  const [items, setItems] = useState('');
  const [dsEstimation, setDsEstimation] = useState('');
  const [leEstimation, setLeEstimation] = useState('');
  const [qaEstimation, setQaEstimation] = useState('');
  const [slackLink, setSlackLink] = useState('');
  const [clickupLink, setClickupLink] = useState('');

  useEffect(() => {
    fetchEstimation();
  }, [id]);

  const fetchEstimation = async () => {
    try {
      const response = await fetch(`/api/estimations/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Estimation not found');
          // Redirect to home page after 2 seconds
          setTimeout(() => router.push('/'), 2000);
          return;
        }
        throw new Error('Failed to fetch estimation');
      }

      const estimation: Estimation = await response.json();

      // Populate form with existing data
      setFundName(estimation.fund_name || '');
      setItems(estimation.items || '');
      setDsEstimation(estimation.ds_estimation || '');
      setLeEstimation(estimation.le_estimation || '');
      setQaEstimation(estimation.qa_estimation || '');
      setSlackLink(estimation.slack_link || '');
      setClickupLink(estimation.clickup_link || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch estimation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fundName.trim()) {
      setError('Fund name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/estimations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fund_name: fundName,
          items: items || null,
          ds_estimation: dsEstimation || null,
          le_estimation: leEstimation || null,
          qa_estimation: qaEstimation || null,
          slack_link: slackLink || null,
          clickup_link: clickupLink || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update estimation');
      }

      // Redirect to home page after successful save
      router.push('/?updated=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update estimation');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error && !fundName) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Database
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Database
        </Link>
        <h1 className="text-3xl font-bold">Edit Estimation</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Estimation Details</CardTitle>
          <CardDescription>
            Edit the estimation information below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fundName">Fund Name *</Label>
            <Input
              id="fundName"
              type="text"
              value={fundName}
              onChange={(e) => setFundName(e.target.value)}
              placeholder="Enter fund name"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="items">Items</Label>
            <Textarea
              id="items"
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="Enter items"
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="dsEstimation">DS Estimation</Label>
            <Input
              id="dsEstimation"
              type="text"
              value={dsEstimation}
              onChange={(e) => setDsEstimation(e.target.value)}
              placeholder="e.g., 2h for annotation, 30m for UI fix"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="leEstimation">LE Estimation</Label>
            <Input
              id="leEstimation"
              type="text"
              value={leEstimation}
              onChange={(e) => setLeEstimation(e.target.value)}
              placeholder="e.g., 1h for logic"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="qaEstimation">QA Estimation</Label>
            <Input
              id="qaEstimation"
              type="text"
              value={qaEstimation}
              onChange={(e) => setQaEstimation(e.target.value)}
              placeholder="e.g., 4-6 hours for testing"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="slackLink">Slack Link</Label>
            <Input
              id="slackLink"
              type="text"
              value={slackLink}
              onChange={(e) => setSlackLink(e.target.value)}
              placeholder="https://your-workspace.slack.com/archives/..."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="clickupLink">ClickUp Link</Label>
            <Input
              id="clickupLink"
              type="text"
              value={clickupLink}
              onChange={(e) => setClickupLink(e.target.value)}
              placeholder="https://app.clickup.com/t/..."
              className="mt-2"
            />
            {clickupLink && (() => {
              try {
                const urlObj = new URL(clickupLink);
                const isValid = urlObj.hostname.includes('clickup.com') || urlObj.hostname.endsWith('.clickup.com');
                return !isValid && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Warning: This doesn't look like a valid ClickUp link
                  </p>
                );
              } catch {
                return (
                  <p className="text-sm text-yellow-600 mt-1">
                    Warning: Invalid URL format
                  </p>
                );
              }
            })()}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || !fundName.trim()}
              className="flex-1"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
