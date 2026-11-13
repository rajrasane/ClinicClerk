-- Review before applying to an existing project. This change has NOT been applied.
-- Prevent direct authenticated REST writes from attaching a visit to another doctor's patient.
-- Existing rows are not changed or deleted.
BEGIN;
ALTER POLICY "visits_optimized_policy" ON public.visits
    WITH CHECK (
        doctor_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.patients AS patient
            WHERE patient.id = visits.patient_id
              AND patient.doctor_id = (SELECT auth.uid())
        )
    );
COMMIT;
