import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data: inquiries, error } = await supabase
      .from('inquiry')
      .select(`
        *,
        customer:c_id (
          c_name,
          c_email,
          c_phone
        ),
        property:p_id (
          location,
          description
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch inquiries', details: error.message }, { status: 500 });
    }
    
    return NextResponse.json(inquiries || []);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { c_name, c_phone, c_email, p_id, message } = body;

    // First, create or get customer
    const { data: existingCustomer } = await supabase
      .from('customer')
      .select('c_id')
      .eq('c_email', c_email)
      .single();
    
    let c_id;
    if (!existingCustomer) {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customer')
        .insert({ c_name, c_phone, c_email })
        .select('c_id')
        .single();
      
      if (customerError) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      
      c_id = newCustomer.c_id;
    } else {
      c_id = existingCustomer.c_id;
    }

    // Create inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiry')
      .insert({ c_id, p_id, message })
      .select()
      .single();

    if (inquiryError) {
      console.error('Error creating inquiry:', inquiryError);
      return NextResponse.json({ error: 'Failed to create inquiry' }, { status: 500 });
    }

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json({ error: 'Failed to create inquiry' }, { status: 500 });
  }
}
