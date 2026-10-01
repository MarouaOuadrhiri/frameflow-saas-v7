-- ============================================================================
-- FrameFlow SaaS — RESET ALL DATA (keeps the structure, wipes test data)
-- Usage (Windows, from the project root):
--   C:\xampp\mysql\bin\mysql.exe -u root frameflow < database\reset.sql
-- Or simply double-click RESET-DATA.bat (asks for confirmation first).
--
-- WARNING: this deletes EVERYTHING: users (accounts), clients, projects,
-- equipment, expenses, payments, purchase list, tasks, events, notifications
-- and files metadata. You will need to re-create the 2 teammate accounts
-- afterwards (backend: npm run create-admin -- "Name" email password).
--
-- NOTE: uploaded files on disk (backend/uploads/...) are NOT deleted by this
-- script. Delete that folder's contents manually if you want a full wipe.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `project_files`;
TRUNCATE TABLE `file_folders`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `calendar_events`;
TRUNCATE TABLE `tasks`;
TRUNCATE TABLE `purchase_items`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `expenses`;
TRUNCATE TABLE `project_equipment`;
TRUNCATE TABLE `equipment`;
TRUNCATE TABLE `projects`;
TRUNCATE TABLE `clients`;
TRUNCATE TABLE `users`;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'FrameFlow data reset: all tables emptied.' AS result;
