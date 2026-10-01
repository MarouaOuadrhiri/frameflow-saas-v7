-- Links notifications to a project (prevents duplicate deadline reminders).
ALTER TABLE `notifications`
  ADD COLUMN IF NOT EXISTS `project_id` INT UNSIGNED NULL
  COMMENT 'Linked project (for deadline-tomorrow reminders, avoids duplicates)';
ALTER TABLE `notifications`
  ADD KEY IF NOT EXISTS `idx_notifications_project` (`project_id`);
