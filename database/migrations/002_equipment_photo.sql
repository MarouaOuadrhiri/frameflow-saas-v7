-- Migration 002: equipment photo
-- Run once on databases created before 2026-09-24.
-- New installs already get this column from schema.sql.

ALTER TABLE `equipment`
  ADD COLUMN IF NOT EXISTS `photo` VARCHAR(255) NULL
  COMMENT 'Stored filename of the equipment photo under backend/uploads/equipment/';
