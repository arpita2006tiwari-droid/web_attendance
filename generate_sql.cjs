const fs = require('fs');

try {
    let rawData = fs.readFileSync('_legacy_backup/students_data.js', 'utf-8');
    rawData = rawData.replace('const STUDENT_DATABASE = ', '').replace(/;\s*$/, '');
    
    // Eval is safe here since it's local data
    let db;
    try {
        db = eval('(' + rawData + ')');
    } catch(e) {
        // Fallback for parsing if eval fails
        const vm = require('vm');
        const script = new vm.Script('db = ' + rawData);
        const context = {};
        script.runInNewContext(context);
        db = context.db;
    }

    let sql = `-- Insert Centers
INSERT INTO centers (id, name) VALUES 
('11111111-1111-1111-1111-111111111111', 'JBCN Mulund'),
('22222222-2222-2222-2222-222222222222', 'JBCN Oshiwara'),
('33333333-3333-3333-3333-333333333333', 'JBCN Lower Parel');

-- Insert Batches for JBCN Mulund
`;

    const mulundId = '11111111-1111-1111-1111-111111111111';
    let batchIdCounter = 1;
    const batchIdMap = {};

    for (const batchName of Object.keys(db)) {
        const batchUuid = `11111111-1111-1111-2222-${String(batchIdCounter).padStart(12, '0')}`;
        batchIdMap[batchName] = batchUuid;
        sql += `INSERT INTO batches (id, center_id, name) VALUES ('${batchUuid}', '${mulundId}', '${batchName.replace(/'/g, "''")}');\n`;
        batchIdCounter++;
    }

    sql += `\n-- Insert Students for JBCN Mulund\n`;

    for (const [batchName, students] of Object.entries(db)) {
        const batchUuid = batchIdMap[batchName];
        for (const student of students) {
            const rollNo = `R-${String(student.srNo).padStart(3, '0')}`;
            sql += `INSERT INTO students (batch_id, student_name, roll_number) VALUES ('${batchUuid}', '${student.name.replace(/'/g, "''")}', '${rollNo}');\n`;
        }
    }

    sql += `
-- Dummy Data for JBCN Oshiwara
INSERT INTO batches (id, center_id, name) VALUES 
('22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-222222222222', 'Grade 1 Alpha'),
('22222222-2222-2222-2222-000000000002', '22222222-2222-2222-2222-222222222222', 'Grade 2 Beta');

INSERT INTO students (batch_id, student_name, roll_number) VALUES 
('22222222-2222-2222-2222-000000000001', 'Oshiwara Student 1', 'R-001'),
('22222222-2222-2222-2222-000000000001', 'Oshiwara Student 2', 'R-002'),
('22222222-2222-2222-2222-000000000002', 'Oshiwara Student 3', 'R-003');

-- Dummy Data for JBCN Lower Parel
INSERT INTO batches (id, center_id, name) VALUES 
('33333333-3333-3333-3333-000000000001', '33333333-3333-3333-3333-333333333333', 'Kindergarten Blue'),
('33333333-3333-3333-3333-000000000002', '33333333-3333-3333-3333-333333333333', 'Kindergarten Red');

INSERT INTO students (batch_id, student_name, roll_number) VALUES 
('33333333-3333-3333-3333-000000000001', 'Lower Parel Student 1', 'R-001'),
('33333333-3333-3333-3333-000000000002', 'Lower Parel Student 2', 'R-002');
`;

    fs.writeFileSync('supabase/insert_data.sql', sql);
    console.log('SQL file generated successfully at supabase/insert_data.sql');
} catch (error) {
    console.error('Error generating SQL:', error);
}
