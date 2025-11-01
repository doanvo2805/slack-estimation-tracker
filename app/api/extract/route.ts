import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { fetchSlackThreadFromUrl } from '@/lib/slack';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
};

export async function POST(request: NextRequest) {
  try {
    const { slackThread, slackLink } = await request.json();

    let threadContent = slackThread;

    // If slackLink is provided, fetch the thread from Slack
    if (slackLink && slackLink.trim() !== '') {
      try {
        threadContent = await fetchSlackThreadFromUrl(slackLink);
      } catch (slackError) {
        return NextResponse.json(
          {
            error: 'Failed to fetch Slack thread',
            details: slackError instanceof Error ? slackError.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    // Validate that we have thread content
    if (!threadContent || threadContent.length < 10) {
      return NextResponse.json(
        { error: 'Slack thread content is required and must be at least 10 characters long' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an AI assistant that extracts estimation data from Slack conversation threads. Analyze the following Slack thread and extract the relevant information in JSON format.

EXTRACTION RULES:
1. Fund Name: Extract from the FIRST message in the thread. This is REQUIRED. Look for phrases like "for ABC Fund", "ABC Fund", or similar patterns.
2. Items: Extract task items mentioned in the most recent conversation portion. Look for references to "item 1", "item 2", or specific task descriptions.
3. DS Estimation: Extract Data Science team's estimation. Look for messages from DS team members. Preserve the exact format (e.g., "2h", "2-3 days", "2h for annotation, 30m for UI fix").
4. LE Estimation: Extract Logic Engineering team's estimation. Preserve exact format.
5. QA Estimation: Extract QA team's estimation. Preserve exact format.
6. ClickUp Link: Extract any URL containing "clickup.com" from the most recent conversation.

SUBTASK RECOGNITION:
Common subtask keywords to identify and preserve: UI Fix, checklist fix, CL fix, blueprint fix, BP fix, CL & UI Fix, BP & UI Fix, annotation, ASA Fix & Map, logic, testing, testing 1, testing 2

CONFIDENCE SCORING:
- Assign a confidence score (0.0 to 1.0) for each field based on:
  - High (0.8-1.0): Clearly stated with explicit attribution
  - Medium (0.5-0.79): Implied or inferred from context
  - Low (0.0-0.49): Uncertain or missing

Return the result in this exact JSON structure:
{
  "fund_name": { "value": "string or null", "confidence": 0.0-1.0 },
  "items": { "value": "string or null", "confidence": 0.0-1.0 },
  "ds_estimation": { "value": "string or null", "confidence": 0.0-1.0 },
  "le_estimation": { "value": "string or null", "confidence": 0.0-1.0 },
  "qa_estimation": { "value": "string or null", "confidence": 0.0-1.0 },
  "clickup_link": { "value": "string or null", "confidence": 0.0-1.0 }
}

SLACK THREAD TO ANALYZE:
${threadContent}

Return ONLY the JSON object, no additional text or explanation.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response from Gemini
    let extractedData: ExtractionResult;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: text },
        { status: 500 }
      );
    }

    // Add slack_link to the response if provided
    const finalData = {
      ...extractedData,
      slack_link: slackLink || null,
    };

    return NextResponse.json(finalData);
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract data from Slack thread', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
