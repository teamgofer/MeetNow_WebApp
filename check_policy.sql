SELECT * FROM pg_policies WHERE tablename = 'meetups' AND policyname LIKE '%anonymous%' LIMIT 10;
