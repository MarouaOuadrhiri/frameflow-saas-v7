-- Migration 003: remove project_team (feature dropped — studio has no use for it)
-- Run once on databases created before 2026-09-24.
-- New installs already ship without this table (see schema.sql).

DROP TABLE IF EXISTS `project_team`;
