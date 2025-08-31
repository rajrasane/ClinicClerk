import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data: appointments, error } = await supabase
      .from('appointment')
      .select(`
        *,
        customer:c_id (
          c_name,
          c_email,
          c_phone
        )
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments', details: error.message }, { status: 500 });
    }
    
    return NextResponse.json(appointments || []);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { c_name, c_phone, c_email, date, time, reason, notes, p_id } = body;

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

    // Check for conflicting appointments
    const { data: conflicts } = await supabase
      .from('appointment')
      .select('a_id')
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'Cancelled');
    
    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Time slot already booked' }, { status: 409 });
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointment')
      .insert({ c_id, p_id, date, time, notes })
      .select()
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
