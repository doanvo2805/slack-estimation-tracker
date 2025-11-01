import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/estimations - Get all estimations with optional search and filter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const filter = searchParams.get('filter');

    let query = supabase
      .from('estimations')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply search if provided
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(
        `fund_name.ilike.${searchTerm},items.ilike.${searchTerm},ds_estimation.ilike.${searchTerm},le_estimation.ilike.${searchTerm},qa_estimation.ilike.${searchTerm}`
      );
    }

    // Apply filter if provided
    if (filter && filter !== 'all') {
      switch (filter) {
        case 'ds':
          query = query.not('ds_estimation', 'is', null).neq('ds_estimation', '');
          break;
        case 'le':
          query = query.not('le_estimation', 'is', null).neq('le_estimation', '');
          break;
        case 'qa':
          query = query.not('qa_estimation', 'is', null).neq('qa_estimation', '');
          break;
        case 'missing':
          query = query.or(
            'ds_estimation.is.null,le_estimation.is.null,qa_estimation.is.null,ds_estimation.eq.,le_estimation.eq.,qa_estimation.eq.'
          );
          break;
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch estimations', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching estimations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/estimations - Create new estimation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fund_name,
      items,
      ds_estimation,
      le_estimation,
      qa_estimation,
      slack_link,
      clickup_link,
      raw_thread,
    } = body;

    // Validate required fields
    if (!fund_name || fund_name.trim() === '') {
      return NextResponse.json(
        { error: 'Fund name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('estimations')
      .insert([
        {
          fund_name: fund_name.trim(),
          items: items || null,
          ds_estimation: ds_estimation || null,
          le_estimation: le_estimation || null,
          qa_estimation: qa_estimation || null,
          slack_link: slack_link || null,
          clickup_link: clickup_link || null,
          raw_thread: raw_thread || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create estimation', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating estimation:', error);
    return NextResponse.json(
      { error: 'Failed to create estimation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
