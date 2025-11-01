import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/estimations/[id] - Get single estimation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('estimations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Estimation not found', details: error.message },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Estimation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching estimation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH /api/estimations/[id] - Update estimation
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    if (fund_name !== undefined && (!fund_name || fund_name.trim() === '')) {
      return NextResponse.json(
        { error: 'Fund name is required' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (fund_name !== undefined) updateData.fund_name = fund_name.trim();
    if (items !== undefined) updateData.items = items || null;
    if (ds_estimation !== undefined) updateData.ds_estimation = ds_estimation || null;
    if (le_estimation !== undefined) updateData.le_estimation = le_estimation || null;
    if (qa_estimation !== undefined) updateData.qa_estimation = qa_estimation || null;
    if (slack_link !== undefined) updateData.slack_link = slack_link || null;
    if (clickup_link !== undefined) updateData.clickup_link = clickup_link || null;
    if (raw_thread !== undefined) updateData.raw_thread = raw_thread || null;

    const { data, error } = await supabase
      .from('estimations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update estimation', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Estimation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating estimation:', error);
    return NextResponse.json(
      { error: 'Failed to update estimation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/estimations/[id] - Delete estimation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('estimations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete estimation', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting estimation:', error);
    return NextResponse.json(
      { error: 'Failed to delete estimation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
