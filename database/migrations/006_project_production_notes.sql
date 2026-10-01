-- Adds an optional free-text production notes field to projects.
ALTER TABLE `projects`
  ADD COLUMN IF NOT EXISTS `production_notes` TEXT NULL AFTER `description`;
