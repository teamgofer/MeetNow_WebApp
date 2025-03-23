-- Make location column nullable to allow direct inserts without PostGIS
ALTER TABLE public.meetups 
ALTER COLUMN location DROP NOT NULL; 