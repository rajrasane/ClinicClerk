import * as XLSX from 'xlsx';

interface PatientData {
  full_name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  blood_group: string;
  allergies: string;
  emergency_contact: string;
}

interface VisitData {
  patient_name: string;
  visit_date: string;
  chief_complaint: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  follow_up_date: string;
  vitals: string;
}

export function generatePatientsExcelBuffer(patients: PatientData[]): Buffer {
  // Create workbook with minimal options
  const workbook = XLSX.utils.book_new();
  
  // Prepare minimal data for Excel - only include non-empty fields
  const excelData = patients.map(patient => {
    const row: Record<string, string | number> = {
      'Patient Name': patient.full_name,
      'Age': patient.age,
      'Gender': patient.gender
    };
    
    // Only add optional fields if they have values
    if (patient.phone) row['Phone'] = patient.phone;
    if (patient.address) row['Address'] = patient.address;
    if (patient.blood_group) row['Blood Group'] = patient.blood_group;
    if (patient.allergies) row['Allergies'] = patient.allergies;
    if (patient.emergency_contact) row['Emergency Contact'] = patient.emergency_contact;
    
    return row;
  });

  // Create worksheet with minimal formatting
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
  
  // Generate buffer with compression
  const excelBuffer = XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true
  });
  return excelBuffer;
}

export function generateVisitsExcelBuffer(visits: VisitData[]): Buffer {
  // Create workbook with minimal options
  const workbook = XLSX.utils.book_new();
  
  // Prepare minimal data for Excel - only include non-empty fields
  const excelData = visits.map(visit => {
    const row: Record<string, string | number> = {
      'Patient Name': visit.patient_name,
      'Visit Date': new Date(visit.visit_date).toLocaleDateString('en-IN')
    };
    
    // Only add optional fields if they have values
    if (visit.chief_complaint) row['Chief Complaint'] = visit.chief_complaint;
    if (visit.symptoms) row['Symptoms'] = visit.symptoms;
    if (visit.diagnosis) row['Diagnosis'] = visit.diagnosis;
    if (visit.prescription) row['Prescription'] = visit.prescription;
    if (visit.notes) row['Notes'] = visit.notes;
    if (visit.follow_up_date) row['Follow-up'] = new Date(visit.follow_up_date).toLocaleDateString('en-IN');
    if (visit.vitals) {
      // Format vitals as readable text instead of JSON
      const vitalsText = typeof visit.vitals === 'string' ? visit.vitals : JSON.stringify(visit.vitals);
      row['Vitals'] = vitalsText;
    }
    
    return row;
  });

  // Create worksheet with minimal formatting
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Visits');
  
  // Generate buffer with compression
  const excelBuffer = XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true
  });
  return excelBuffer;
}
