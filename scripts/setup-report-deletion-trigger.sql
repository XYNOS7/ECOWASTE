
-- Create function to decrement report count when a report is deleted
CREATE OR REPLACE FUNCTION decrement_report_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's profile to decrement total_reports
  UPDATE profiles 
  SET 
    total_reports = GREATEST(total_reports - 1, 0),
    updated_at = NOW()
  WHERE id = OLD.user_id;
  
  -- Log the deletion activity
  INSERT INTO activity_logs (user_id, activity_type, title, description, coins_earned)
  VALUES (
    OLD.user_id,
    'report_deleted',
    'Report Deleted by Admin',
    CASE 
      WHEN TG_TABLE_NAME = 'waste_reports' THEN 'Your waste report "' || OLD.title || '" was removed by an administrator'
      ELSE 'Your dirty area report "' || OLD.title || '" was removed by an administrator'
    END,
    0
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both waste_reports and dirty_area_reports tables
DROP TRIGGER IF EXISTS on_waste_report_delete ON waste_reports;
CREATE TRIGGER on_waste_report_delete
  AFTER DELETE ON waste_reports
  FOR EACH ROW
  EXECUTE FUNCTION decrement_report_count();

DROP TRIGGER IF EXISTS on_dirty_area_report_delete ON dirty_area_reports;
CREATE TRIGGER on_dirty_area_report_delete
  AFTER DELETE ON dirty_area_reports
  FOR EACH ROW
  EXECUTE FUNCTION decrement_report_count();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION decrement_report_count() TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_report_count() TO anon;
