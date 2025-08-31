import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { o_name, o_phone, o_email } = body;

    // Check if owner already exists by email or phone
    const { data: existingOwner, error: searchError } = await supabase
      .from('owner')
      .select('o_id')
      .or(`o_email.eq.${o_email},o_phone.eq.${o_phone}`)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for existing owner:', searchError);
      return NextResponse.json({ error: 'Failed to search for owner' }, { status: 500 });
    }

    // If owner exists, return existing owner
    if (existingOwner) {
      return NextResponse.json(existingOwner);
    }

    // Create new owner
    const { data: newOwner, error: insertError } = await supabase
      .from('owner')
      .insert({
        o_name,
        o_phone,
        o_email
      })
      .select('o_id')
      .single();

    if (insertError) {
      console.error('Error creating owner:', insertError);
      return NextResponse.json({ error: 'Failed to create owner', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newOwner);
  } catch (error) {
    console.error('Error in owners API:', error);
    return NextResponse.json({ error: 'Failed to process owner request' }, { status: 500 });
  }
}
