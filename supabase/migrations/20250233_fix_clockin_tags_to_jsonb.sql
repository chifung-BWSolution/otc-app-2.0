DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'bubble_clockin' AND column_name = 'tags_in';

  IF col_type = 'text' THEN
    UPDATE bubble_clockin SET tags_in = NULL WHERE tags_in = '';
    UPDATE bubble_clockin SET tags_out = NULL WHERE tags_out = '';

    ALTER TABLE bubble_clockin
      ALTER COLUMN tags_in TYPE JSONB USING
        CASE
          WHEN tags_in IS NULL THEN NULL
          WHEN tags_in ~ '^\[' THEN tags_in::jsonb
          ELSE jsonb_build_array(tags_in)
        END;

    ALTER TABLE bubble_clockin
      ALTER COLUMN tags_out TYPE JSONB USING
        CASE
          WHEN tags_out IS NULL THEN NULL
          WHEN tags_out ~ '^\[' THEN tags_out::jsonb
          ELSE jsonb_build_array(tags_out)
        END;
  END IF;
END $$;
