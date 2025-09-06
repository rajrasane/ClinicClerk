import { NextRequest, NextResponse } from 'next/server';
import { generateVisitsExcelBuffer } from '@/lib/excel-generator-server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { generateVisitsPDFBuffer } from '@/lib/pdf-generator-server';


// GET /api/export/visits - Export visits data as CSV/PDF
export async function GET(request: NextRequest) {
  // Check authentication
  const supabase = createSupabaseServerClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'csv';

    if (!['csv', 'json', 'pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv, json, pdf, or excel' }, { status: 400 });
    }


    // Build query with RLS automatically filtering by doctor_id
    // Only fetch fields needed for export to save bandwidth
    let query = supabase
      .from('visits')
      .select(`
        patient_id, visit_date, chief_complaint, 
        symptoms, diagnosis, prescription, notes, 
        follow_up_date, vitals,
        patients(first_name, middle_name, last_name)
      `)
      .order('visit_date', { ascending: false });

    // Add filters
    if (patientId) {
      query = query.eq('patient_id', parseInt(patientId));
    }

    if (search) {
      query = query.or(`chief_complaint.ilike.%${search}%,diagnosis.ilike.%${search}%`);
    }

    if (startDate) {
      query = query.gte('visit_date', startDate);
    }

    if (endDate) {
      query = query.lte('visit_date', endDate);
    }

    const { data: visits, error } = await query;

    if (error) {
      throw error;
    }

    if (!visits || visits.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No visits found to export' },
        { status: 404 }
      );
    }

    // Process visits data - only fields needed for export
    const processedVisits = (visits as {
      patients: { first_name?: string; middle_name?: string; last_name?: string };
      visit_date: string;
      chief_complaint?: string;
      symptoms?: string;
      diagnosis?: string;
      prescription?: string;
      notes?: string;
      follow_up_date?: string;
      vitals?: string;
    }[]).map((visit) => {
      const patient = visit.patients;
      return {
        patient_name: `${patient?.first_name || ''} ${patient?.middle_name ? patient.middle_name + ' ' : ''}${patient?.last_name || ''}`.trim(),
        visit_date: new Date(visit.visit_date).toLocaleDateString('en-IN'),
        chief_complaint: visit.chief_complaint || '',
        symptoms: visit.symptoms || '',
        diagnosis: visit.diagnosis || '',
        prescription: visit.prescription || '',
        notes: visit.notes || '',
        follow_up_date: visit.follow_up_date ? new Date(visit.follow_up_date).toLocaleDateString('en-IN') : '',
        vitals: visit.vitals || ''
      };
    });

    if (format === 'csv') {
      // Generate CSV - only essential fields
      const csvHeaders = [
        'Patient Name',
        'Visit Date',
        'Chief Complaint',
        'Symptoms',
        'Diagnosis',
        'Prescription',
        'Notes',
        'Follow-up Date',
        'Vitals'
      ];

      const csvRows = processedVisits.map(visit => [
        `"${visit.patient_name}"`,
        visit.visit_date,
        `"${visit.chief_complaint}"`,
        `"${visit.symptoms}"`,
        `"${visit.diagnosis}"`,
        `"${visit.prescription}"`,
        `"${visit.notes}"`,
        visit.follow_up_date,
        `"${visit.vitals}"`
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = patientId 
        ? `patient_${patientId}_visits_export_${timestamp}.csv`
        : `visits_export_${timestamp}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Return Excel format
    if (format === 'excel') {
      // Generate Excel buffer on server
      const excelBuffer = generateVisitsExcelBuffer(processedVisits);
      
      const filename = `visits_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      return new NextResponse(Buffer.from(excelBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Return PDF format
    if (format === 'pdf') {
      // Get doctor info for PDF header
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      const doctorName = doctorData ? `Dr. ${doctorData.first_name} ${doctorData.last_name}` : 'Doctor';
      
      // Generate PDF buffer on server
      const pdfBuffer = generateVisitsPDFBuffer(processedVisits, doctorName);
      
      const filename = `visits_export_${new Date().toISOString().split('T')[0]}.pdf`;
      
      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Return JSON format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: processedVisits,
        total: processedVisits.length,
        exported_at: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error exporting visits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export visits' },
      { status: 500 }
    );
  }
}
