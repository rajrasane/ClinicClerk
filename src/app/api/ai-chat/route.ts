import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RequestBody {
  message: string;
  history: Message[];
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  blood_group?: string;
  allergies?: string;
}

interface Visit {
  id: number;
  visit_date: string;
  chief_complaint: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
  patients?: {
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const { message, history }: RequestBody = await request.json();
    const supabase = createSupabaseServerClient(request);

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .eq('doctor_id', user.id);

    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('*, patients(first_name, last_name, age, gender)')
      .eq('doctor_id', user.id);

    if (patientsError || visitsError) {
      console.error('Database error:', patientsError || visitsError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const dataContext = `
You are an AI assistant analyzing patient data for a doctor.

PATIENTS (${patients?.length || 0}):
${(patients as Patient[])
  ?.map(
    (p: Patient) =>
      `- ${p.first_name} ${p.last_name}, ${p.age}y ${p.gender}, Blood: ${p.blood_group || 'N/A'}, Allergies: ${p.allergies || 'None'}`
  )
  .join('\n')}

VISITS (${visits?.length || 0}):
${(visits as Visit[])
  ?.map(
    (v: Visit) =>
      `- ${v.patients?.first_name} ${v.patients?.last_name}, ${v.visit_date}: ${v.chief_complaint} | Dx: ${v.diagnosis || 'N/A'} | Rx: ${v.prescription || 'N/A'}`
  )
  .join('\n')}

Instructions: Answer accurately about patient data. Provide stats when asked. Maintain privacy. Today: ${new Date().toISOString().split('T')[0]}

Question: ${message}
`;

    const conversationHistory = history
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = conversationHistory
      ? `${dataContext}\n\nHistory:\n${conversationHistory}\n\nCurrent: ${message}`
      : dataContext;

    const genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
