import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';
import { generatePatientsPDFBuffer } from '@/lib/pdf-generator-server';
import { generatePatientsExcelBuffer } from '@/lib/excel-generator-server';
import { sanitizeSearchTerms } from '@/lib/sanitize';

// GET /api/export/patients - Export patients data as CSV/PDF
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
    const search = searchParams.get('search') || '';
    const format = searchParams.get('format') || 'csv';

    if (!['csv', 'json', 'pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use csv, json, pdf, or excel' }, { status: 400 });
    }


    // Build query with RLS automatically filtering by doctor_id
    // Only fetch fields needed for export to save bandwidth
    let query = supabase
      .from('patients')
      .select(`
        first_name, middle_name, last_name, age, gender, 
        phone, address, blood_group, allergies, 
        emergency_contact
      `)
      .order('created_at', { ascending: false });

    // Add search filter if provided (sanitized to prevent injection)
    if (search) {
      const searchTerms = sanitizeSearchTerms(search);
      searchTerms.forEach(term => {
        query = query.or(`first_name.ilike.%${term}%,middle_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`);
      });
    }

    const { data: patients, error } = await query;

    if (error) {
      throw error;
    }

    if (!patients || patients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No patients found to export' },
        { status: 404 }
      );
    }

    // Process patients data - only fields needed for export
    const processedPatients = patients.map(patient => ({
      first_name: patient.first_name,
      middle_name: patient.middle_name || '',
      last_name: patient.last_name,
      full_name: `${patient.first_name} ${patient.middle_name ? patient.middle_name + ' ' : ''}${patient.last_name}`,
      age: patient.age,
      gender: patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other',
      phone: patient.phone || '',
      address: patient.address || '',
      blood_group: patient.blood_group || '',
      allergies: patient.allergies || '',
      emergency_contact: patient.emergency_contact || ''
    }));

    if (format === 'csv') {
      // Generate CSV - only essential fields
      const csvHeaders = [
        'Patient Name',
        'Age',
        'Gender',
        'Phone',
        'Address',
        'Blood Group',
        'Allergies',
        'Emergency Contact'
      ];

      const csvRows = processedPatients.map(patient => [
        `"${patient.full_name}"`,
        patient.age,
        patient.gender,
        patient.phone,
        `"${patient.address}"`,
        patient.blood_group,
        `"${patient.allergies}"`,
        patient.emergency_contact
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `patients_export_${timestamp}.csv`;

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
      const excelBuffer = generatePatientsExcelBuffer(processedPatients);

      const filename = `patients_export_${new Date().toISOString().split('T')[0]}.xlsx`;

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
      const pdfBuffer = generatePatientsPDFBuffer(processedPatients, doctorName);

      const filename = `patients_export_${new Date().toISOString().split('T')[0]}.pdf`;

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
        data: processedPatients,
        total: processedPatients.length,
        exported_at: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error exporting patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export patients' },
      { status: 500 }
    );
  }
}
