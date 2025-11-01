'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toTitleCase } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';

type ExtractedField = {
  value: string | null;
  confidence: number;
};

type ExtractionResult = {
  fund_name: ExtractedField;
  items: ExtractedField;
  ds_estimation: ExtractedField;
  le_estimation: ExtractedField;
  qa_estimation: ExtractedField;
  clickup_link: ExtractedField;
  slack_link?: string | null;
};

export default function ExtractPage() {
  const router = useRouter();
  const [slackThread, setSlackThread] = useState('');
  const [slackLink, setSlackLink] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);

  // Form state for preview/edit
  const [fundName, setFundName] = useState('');
  const [items, setItems] = useState('');
  const [dsEstimation, setDsEstimation] = useState('');
  const [leEstimation, setLeEstimation] = useState('');
  const [qaEstimation, setQaEstimation] = useState('');
  const [editableSlackLink, setEditableSlackLink] = useState('');
  const [clickupLink, setClickupLink] = useState('');

  const validateSlackThread = (thread: string): { valid: boolean; error?: string } => {
    if (thread.length < 50) {
      return { valid: false, error: 'Thread content must be at least 50 characters long' };
    }

    // Check for structure (should have colons or newlines indicating conversation format)
    if (!thread.includes('\n') && !thread.includes(':')) {
      return { valid: false, error: 'Thread should contain a conversation with multiple messages' };
    }

    // Check for meaningful words
    const words = thread.split(/\s+/).filter(w => w.length > 2);
    if (words.length < 10) {
      return { valid: false, error: 'Thread should contain at least 10 meaningful words' };
    }

    return { valid: true };
  };

  const handleExtract = async () => {
    // Validate that we have either a Slack link or thread content
    if (!slackLink && !slackThread) {
      setError('Please provide either a Slack thread URL or paste the thread content');
      return;
    }

    // Validate manual thread if provided
    if (!slackLink && slackThread) {
      const validation = validateSlackThread(slackThread);
      if (!validation.valid) {
        setError(validation.error || 'Invalid thread content');
        return;
      }
    }

    setIsExtracting(true);
    setError('');

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slackThread, slackLink }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : (errorData.error || 'Failed to extract data');
        throw new Error(errorMessage);
      }

      const data: ExtractionResult = await response.json();
      setExtractedData(data);

      // Populate form fields with extracted data
      // Keep fund_name in original case, apply title case to other fields
      setFundName(data.fund_name.value || '');
      setItems(toTitleCase(data.items.value) || '');
      setDsEstimation(toTitleCase(data.ds_estimation.value) || '');
      setLeEstimation(toTitleCase(data.le_estimation.value) || '');
      setQaEstimation(toTitleCase(data.qa_estimation.value) || '');
      setEditableSlackLink(slackLink || '');
      setClickupLink(data.clickup_link.value || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract data');
    } finally {
      setIsExtracting(false);
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
      const response = await fetch('/api/estimations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fund_name: fundName,
          items: items || null,
          ds_estimation: dsEstimation || null,
          le_estimation: leEstimation || null,
          qa_estimation: qaEstimation || null,
          slack_link: editableSlackLink || null,
          clickup_link: clickupLink || null,
          raw_thread: slackThread,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save estimation');
      }

      // Redirect to home page after successful save
      router.push('/?success=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save estimation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSlackThread('');
    setSlackLink('');
    setExtractedData(null);
    setError('');
    setFundName('');
    setItems('');
    setDsEstimation('');
    setLeEstimation('');
    setQaEstimation('');
    setEditableSlackLink('');
    setClickupLink('');
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-500">High</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-yellow-500">Medium</Badge>;
    } else {
      return <Badge className="bg-red-500">Low</Badge>;
    }
  };

  const getConfidenceClass = (confidence: number) => {
    if (confidence < 0.7) {
      return 'bg-yellow-50 border-yellow-200';
    }
    return '';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Slack Estimation Tracker</h1>
        <p className="text-gray-600">Extract estimation data from Slack threads using AI</p>
      </div>

      {!extractedData ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Provide Slack Thread</CardTitle>
            <CardDescription>
              Paste a Slack thread URL to automatically fetch the conversation, or manually paste the thread content below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="slackLink">Slack Thread URL (Recommended)</Label>
              <Input
                id="slackLink"
                type="text"
                placeholder="https://your-workspace.slack.com/archives/C1234567890/p1234567890123456"
                value={slackLink}
                onChange={(e) => setSlackLink(e.target.value)}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                The app will automatically fetch messages from this thread
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or paste manually</span>
              </div>
            </div>

            <div>
              <Label htmlFor="slackThread">Slack Thread Content (Optional)</Label>
              <Textarea
                id="slackThread"
                placeholder="Paste your Slack thread here if you don't have a URL..."
                value={slackThread}
                onChange={(e) => setSlackThread(e.target.value)}
                rows={8}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Only needed if you can't provide a Slack URL above
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleExtract}
                disabled={isExtracting || (!slackLink && slackThread.length < 50)}
                className="flex-1"
              >
                {isExtracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isExtracting ? (slackLink ? 'Fetching from Slack...' : 'AI is analyzing thread...') : 'Extract Estimations'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Review and Edit Extracted Data</CardTitle>
            <CardDescription>
              Review the AI-extracted data and make any necessary corrections before saving
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={getConfidenceClass(extractedData.fund_name.confidence)}>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="fundName">Fund Name *</Label>
                {getConfidenceBadge(extractedData.fund_name.confidence)}
              </div>
              <Input
                id="fundName"
                type="text"
                value={fundName}
                onChange={(e) => setFundName(e.target.value)}
                placeholder="Enter fund name"
              />
            </div>

            <div className={getConfidenceClass(extractedData.items.confidence)}>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="items">Items</Label>
                {getConfidenceBadge(extractedData.items.confidence)}
              </div>
              <Textarea
                id="items"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="Enter items"
                rows={3}
              />
            </div>

            <div className={getConfidenceClass(extractedData.ds_estimation.confidence)}>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="dsEstimation">DS Estimation</Label>
                {getConfidenceBadge(extractedData.ds_estimation.confidence)}
              </div>
              <Input
                id="dsEstimation"
                type="text"
                value={dsEstimation}
                onChange={(e) => setDsEstimation(e.target.value)}
                placeholder="e.g., 2h for annotation, 30m for UI fix"
              />
            </div>

            <div className={getConfidenceClass(extractedData.le_estimation.confidence)}>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="leEstimation">LE Estimation</Label>
                {getConfidenceBadge(extractedData.le_estimation.confidence)}
              </div>
              <Input
                id="leEstimation"
                type="text"
                value={leEstimation}
                onChange={(e) => setLeEstimation(e.target.value)}
                placeholder="e.g., 1h for logic"
              />
            </div>

            <div className={getConfidenceClass(extractedData.qa_estimation.confidence)}>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="qaEstimation">QA Estimation</Label>
                {getConfidenceBadge(extractedData.qa_estimation.confidence)}
              </div>
              <Input
                id="qaEstimation"
                type="text"
                value={qaEstimation}
                onChange={(e) => setQaEstimation(e.target.value)}
                placeholder="e.g., 4-6 hours for testing"
              />
            </div>

            <div>
              <Label htmlFor="editableSlackLink">Slack Link</Label>
              <Input
                id="editableSlackLink"
                type="text"
                value={editableSlackLink}
                onChange={(e) => setEditableSlackLink(e.target.value)}
                placeholder="https://your-workspace.slack.com/archives/..."
                className="mt-2"
              />
            </div>

            <div className={getConfidenceClass(extractedData.clickup_link.confidence)}>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="clickupLink">ClickUp Link</Label>
                {getConfidenceBadge(extractedData.clickup_link.confidence)}
              </div>
              <Input
                id="clickupLink"
                type="text"
                value={clickupLink}
                onChange={(e) => setClickupLink(e.target.value)}
                placeholder="https://app.clickup.com/t/..."
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
                {isSaving ? 'Saving...' : 'Save to Database'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
