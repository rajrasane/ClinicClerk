import { apiFailure } from '@/lib/api-security';
import { ApiError, parsePositiveId, validateDate } from '@/lib/api-validation';
import { createCsv } from '@/lib/csv';
import { NextRequest, NextResponse } from 'next/server';
import { generateVisitsExcelBuffer } from '@/lib/excel-generator-server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';
import { generateVisitsPDFBuffer } from '@/lib/pdf-generator-server';
import { sanitizeSearchTerm } from '@/lib/sanitize';


// GET /api/export/visits - Export visits data as CSV/PDF
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient(request);
    const { searchParams } = new URL(request.url);
    const rawPatientId = searchParams.get('patient_id');
    const patientId = rawPatientId === null ? null : parsePositiveId(rawPatientId, 'Patient ID');
    const search = searchParams.get('search');
    const rawStartDate = searchParams.get('startDate');
    const startDate = rawStartDate === null ? null : validateDate(rawStartDate, 'Start date');
    const rawEndDate = searchParams.get('endDate');
    const endDate = rawEndDate === null ? null : validateDate(rawEndDate, 'End date');
    if (startDate && endDate && startDate > endDate) throw new ApiError('Start date must not be after end date');
    const format = searchParams.get('format') || 'csv';

    if (!['csv', 'json', 'pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv, json, pdf, or excel' }, { status: 400 });
    }


    // Scope to the authenticated doctor in addition to database RLS.
    // Only fetch fields needed for export to save bandwidth
    let query = supabase
      .from('visits')
      .select(`
        patient_id, visit_date, chief_complaint, 
        symptoms, diagnosis, prescription, notes, 
        follow_up_date, vitals,
        patients!inner(first_name, middle_name, last_name)
      `)
      .eq('doctor_id', user.id)
      .eq('patients.doctor_id', user.id)
      .order('visit_date', { ascending: false });

    // Add filters
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (search) {
      const sanitizedSearch = sanitizeSearchTerm(search);
      if (sanitizedSearch) {
        query = query.or(`chief_complaint.ilike.%${sanitizedSearch}%,diagnosis.ilike.%${sanitizedSearch}%`);
      }
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
    const processedVisits = (visits as unknown as {
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
        visit_date: visit.visit_date,
        chief_complaint: visit.chief_complaint || '',
        symptoms: visit.symptoms || '',
        diagnosis: visit.diagnosis || '',
        prescription: visit.prescription || '',
        notes: visit.notes || '',
        follow_up_date: visit.follow_up_date || '',
        vitals: typeof visit.vitals === 'object' && visit.vitals !== null ? JSON.stringify(visit.vitals) : visit.vitals || ''
      };
    });

    const displayVisits = processedVisits.map(visit => ({
      ...visit,
      visit_date: new Date(visit.visit_date).toLocaleDateString('en-IN', { timeZone: 'UTC' }),
      follow_up_date: visit.follow_up_date ? new Date(visit.follow_up_date).toLocaleDateString('en-IN', { timeZone: 'UTC' }) : ''
    }));

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

      const csvRows = displayVisits.map(visit => [
        visit.patient_name,
        visit.visit_date,
        visit.chief_complaint,
        visit.symptoms,
        visit.diagnosis,
        visit.prescription,
        visit.notes,
        visit.follow_up_date,
        visit.vitals
      ]);

      const csvContent = createCsv(csvHeaders, csvRows);

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = patientId
        ? `patient_${patientId}_visits_export_${timestamp}.csv`
        : `visits_export_${timestamp}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'private, no-store'
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
          'Cache-Control': 'private, no-store'
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
      const pdfBuffer = generateVisitsPDFBuffer(displayVisits, doctorName);

      const filename = `visits_export_${new Date().toISOString().split('T')[0]}.pdf`;

      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'private, no-store'
        }
      });
    }

    // Return JSON format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: displayVisits,
        total: processedVisits.length,
        exported_at: new Date().toISOString()
      }, { headers: { 'Cache-Control': 'private, no-store' } });
    }

  } catch (error) {
    return apiFailure(error, 'Failed to export visits');
  }
}
