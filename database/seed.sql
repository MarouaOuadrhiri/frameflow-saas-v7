-- ============================================================================
-- FrameFlow SaaS — seed (empty)
-- Run on a FRESH database AFTER schema.sql:  mysql -u root -p frameflow < seed.sql
--
-- This installs an EMPTY workspace: no demo users, no demo data.
-- Create the two teammate accounts with:
--   cd backend && npm run create-admin -- "Full Name" email password
-- (run once per teammate)
--
-- Want the demo dataset for testing? Run seed.demo.sql instead:
--   mysql -u root -p frameflow < seed.demo.sql
-- Demo login:  yassine@frameflow.studio  /  demo1234
-- ============================================================================

USE `frameflow`;
SET NAMES utf8mb4;

-- No rows: the studio starts empty and fills in its own data.
