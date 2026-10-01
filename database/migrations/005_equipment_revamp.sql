-- Migration 005: equipment revamp + feature removals + calendar reminders
-- Run once on databases created before 2026-09-24.

-- 1) Equipment: drop the `status` column, add a simple `damaged` flag.
--    Damaged items are shown with a red border in the UI.
--    (Items previously marked 'damaged' keep their flag.)
ALTER TABLE `equipment`
  ADD COLUMN `damaged` TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = damaged/broken, shown with a red border';
UPDATE `equipment` SET `damaged` = 1 WHERE `status` = 'damaged';
ALTER TABLE `equipment` DROP COLUMN `status`;

-- 2) Drop the removed features' tables.
DROP TABLE IF EXISTS `equipment_issues`;
DROP TABLE IF EXISTS `checklist_items`;
DROP TABLE IF EXISTS `checklist_templates`;

-- 3) Calendar events get an optional start time (needed for 1-hour-before reminders).
ALTER TABLE `calendar_events`
  ADD COLUMN `time` TIME NULL
  COMMENT 'Start time — used for 1-hour-before reminders';

-- 4) Notifications can link to a calendar event (prevents duplicate reminders).
ALTER TABLE `notifications`
  ADD COLUMN `event_id` INT UNSIGNED NULL
  COMMENT 'Linked calendar event (for 1h-before reminders, avoids duplicates)';
ALTER TABLE `notifications`
  ADD KEY `idx_notifications_event` (`event_id`);
