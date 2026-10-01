-- Migration 004: remove activity_log (feature dropped — studio has no use for it)
-- Run once on databases created before 2026-09-24.
-- New installs already ship without this table (see schema.sql).

DROP TABLE IF EXISTS `activity_log`;
