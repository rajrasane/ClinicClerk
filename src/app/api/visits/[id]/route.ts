import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase-server';

// GET /api/visits/[id] - Get specific visit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const visitId = parseInt(id);
    
    if (isNaN(visitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visit ID' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(request);

    // Get visit with patient details (RLS automatically filters by doctor_id)
    const { data: visit, error } = await supabase
      .from('visits')
      .select(`
        id, patient_id, visit_date, chief_complaint, 
        symptoms, diagnosis, prescription, notes, 
        follow_up_date, vitals, images, created_at, updated_at,
        patients(first_name, last_name, phone, age, gender)
      `)
      .eq('id', visitId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Visit not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching visit:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch visit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: visit
    });

  } catch (error) {
    console.error('Error fetching visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visit' },
      { status: 500 }
    );
  }
}

// PUT /api/visits/[id] - Update visit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const visitId = parseInt(id);
    
    if (isNaN(visitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visit ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      visit_date,
      chief_complaint,
      symptoms,
      diagnosis,
      prescription,
      notes,
      follow_up_date,
      vitals,
      images
    } = body;

    // Validate required fields
    if (!chief_complaint) {
      return NextResponse.json(
        { success: false, error: 'Chief complaint is required' },
        { status: 400 }
      );
    }

    // Validate vitals JSON if provided
    if (vitals) {
      try {
        JSON.parse(JSON.stringify(vitals));
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid vitals format' },
          { status: 400 }
        );
      }
    }

    const supabase = createSupabaseServerClient(request);

    // Update visit (RLS automatically filters by doctor_id)
    const updateData: Record<string, unknown> = {};
    if (visit_date !== undefined) updateData.visit_date = visit_date;
    if (chief_complaint !== undefined) updateData.chief_complaint = chief_complaint;
    if (symptoms !== undefined) updateData.symptoms = symptoms;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (prescription !== undefined) updateData.prescription = prescription;
    if (notes !== undefined) updateData.notes = notes;
    if (follow_up_date !== undefined) updateData.follow_up_date = follow_up_date;
    if (vitals !== undefined) updateData.vitals = vitals;
    if (images !== undefined) updateData.images = images;

    const { data: updatedVisit, error } = await supabase
      .from('visits')
      .update(updateData)
      .eq('id', visitId)
      .select(`
        id, patient_id, visit_date, chief_complaint, 
        symptoms, diagnosis, prescription, notes, 
        follow_up_date, vitals, images, created_at, updated_at,
        patients(first_name, last_name, phone, age, gender)
      `)
      .single();

    if (error) {
      throw error;
    }

    if (!updatedVisit) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedVisit,
      message: 'Visit updated successfully'
    });

  } catch (error) {
    console.error('Error updating visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update visit' },
      { status: 500 }
    );
  }
}

// DELETE /api/visits/[id] - Delete a visit
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const visitId = parseInt(id);
    
    if (isNaN(visitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visit ID' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(request);

    // First, get the visit to retrieve image URLs before deletion
    const { data: visitToDelete, error: fetchError } = await supabase
      .from('visits')
      .select('images')
      .eq('id', visitId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Visit not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Delete associated images from storage if they exist
    if (visitToDelete?.images && Array.isArray(visitToDelete.images) && visitToDelete.images.length > 0) {
      try {
        const imagesToDelete = visitToDelete.images.map((image: any) => {
          // Extract file path from URL: https://xxx.supabase.co/storage/v1/object/public/visit-images/doctor_id/filename
          const url = image.url;
          const pathMatch = url.match(/\/visit-images\/(.+)$/);
          return pathMatch ? pathMatch[1] : null;
        }).filter(Boolean);

        if (imagesToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('visit-images')
            .remove(imagesToDelete);

          if (storageError) {
            console.error('Error deleting images from storage:', storageError);
            // Continue with visit deletion even if image cleanup fails
          }
        }
      } catch (imageError) {
        console.error('Error processing images for deletion:', imageError);
        // Continue with visit deletion even if image cleanup fails
      }
    }

    // Delete visit (RLS automatically filters by doctor_id)
    const { data: deletedVisit, error } = await supabase
      .from('visits')
      .delete()
      .eq('id', visitId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }

    if (!deletedVisit) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedVisit,
      message: 'Visit and associated images deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete visit' },
      { status: 500 }
    );
  }
}
