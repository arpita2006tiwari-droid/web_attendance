-- Supabase Schema for Attendance Web App

-- 1. Centers Table
CREATE TABLE centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Batches Table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Students Table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Attendance Table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    attendance_time TIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent duplicate attendance for the same student on the same date
    UNIQUE(student_id, attendance_date)
);

-- Create Indexes for optimization
CREATE INDEX idx_batches_center_id ON batches(center_id);
CREATE INDEX idx_students_batch_id ON students(batch_id);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, attendance_date);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- Enable Row Level Security (RLS)
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create Policies (assuming authenticated users (teachers) have full access for now)
-- Adjust these based on your specific auth requirements.
CREATE POLICY "Allow authenticated users to read centers" ON centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read batches" ON batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read attendance" ON attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update attendance" ON attendance FOR UPDATE TO authenticated USING (true);

-- Optional: Insert dummy data for testing
-- INSERT INTO centers (name) VALUES ('Main Campus'), ('North Branch');
