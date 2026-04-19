SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assignment_progress' 
ORDER BY ordinal_position;
