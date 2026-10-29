-- ============================================================================
-- FrameFlow SaaS — MySQL 8 / MariaDB schema
-- Run on a FRESH database:  mysql -u root -p < schema.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `frameflow`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `frameflow`;

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- Users (each tenant owns all of their rows via user_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(120) NOT NULL,
  `email`         VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          VARCHAR(60)  NOT NULL DEFAULT 'Director',
  `initials`      VARCHAR(8)   NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Clients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `name`       VARCHAR(160) NOT NULL,
  `company`    VARCHAR(160) NULL,
  `email`      VARCHAR(190) NULL,
  `phone`      VARCHAR(60)  NULL,
  `notes`      TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clients_user` (`user_id`),
  CONSTRAINT `fk_clients_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Projects
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `projects` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `client_id`   INT UNSIGNED NULL,
  `name`        VARCHAR(190) NOT NULL,
  `type`        VARCHAR(80)  NOT NULL DEFAULT '',
  `status`      ENUM('planning','pre-production','production','post-production','review','completed','archived') NOT NULL DEFAULT 'planning',
  `thumb`       VARCHAR(255) NULL,
  `deadline`    DATE NULL,
  `start_date`  DATE NULL,
  `location`    VARCHAR(190) NULL,
  `description` TEXT NULL,
  `production_notes` TEXT NULL,
  `price`       DECIMAL(12,2) NOT NULL DEFAULT 0,
  `paid`        DECIMAL(12,2) NOT NULL DEFAULT 0,
  `progress`    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_projects_user` (`user_id`),
  KEY `idx_projects_client` (`client_id`),
  CONSTRAINT `fk_projects_user`   FOREIGN KEY (`user_id`)   REFERENCES `users` (`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_projects_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Equipment inventory
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equipment` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED NOT NULL,
  `name`          VARCHAR(160) NOT NULL,
  `brand`         VARCHAR(80)  NULL,
  `model`         VARCHAR(80)  NULL,
  `category`      VARCHAR(60)  NOT NULL DEFAULT '',
  `price`         DECIMAL(12,2) NOT NULL DEFAULT 0,
  `purchase_date` DATE NULL,
  `condition`     VARCHAR(40)  NOT NULL DEFAULT 'Good',
  `damaged`       TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '1 = damaged/broken, shown with a red border',
  `photo`         VARCHAR(255) NULL COMMENT 'Stored filename of the equipment photo under backend/uploads/equipment/',
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_equipment_user` (`user_id`),
  CONSTRAINT `fk_equipment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Equipment assigned to a project (shoot checklist)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_equipment` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id`   INT UNSIGNED NOT NULL,
  `equipment_id` INT UNSIGNED NULL,
  `item_name`    VARCHAR(160) NOT NULL,
  `status`       ENUM('ok','missing','damaged') NOT NULL DEFAULT 'ok',
  `est_price`    DECIMAL(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_project_equipment_project` (`project_id`),
  CONSTRAINT `fk_project_equipment_project`   FOREIGN KEY (`project_id`)   REFERENCES `projects` (`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_project_equipment_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Expenses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id`     INT UNSIGNED NOT NULL,
  `user_id`        INT UNSIGNED NOT NULL,
  `date`           DATE NOT NULL,
  `description`    VARCHAR(255) NOT NULL,
  `category`       VARCHAR(60)  NOT NULL DEFAULT '',
  `amount`         DECIMAL(12,2) NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(40)  NULL,
  `receipt`        VARCHAR(255) NULL,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_user` (`user_id`),
  KEY `idx_expenses_project` (`project_id`),
  CONSTRAINT `fk_expenses_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_expenses_user`    FOREIGN KEY (`user_id`)    REFERENCES `users` (`id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Payments (client payments received)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT UNSIGNED NOT NULL,
  `user_id`    INT UNSIGNED NOT NULL,
  `date`       DATE NOT NULL,
  `amount`     DECIMAL(12,2) NOT NULL DEFAULT 0,
  `method`     VARCHAR(60)  NOT NULL DEFAULT '',
  `notes`      TEXT NULL,
  `status`     ENUM('paid','pending') NOT NULL DEFAULT 'paid',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_user` (`user_id`),
  KEY `idx_payments_project` (`project_id`),
  CONSTRAINT `fk_payments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_user`    FOREIGN KEY (`user_id`)    REFERENCES `users` (`id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Purchase list
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_items` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `project_id` INT UNSIGNED NULL,
  `item`       VARCHAR(160) NOT NULL,
  `category`   VARCHAR(60)  NOT NULL DEFAULT '',
  `qty`        INT NOT NULL DEFAULT 1,
  `est_price`  DECIMAL(12,2) NOT NULL DEFAULT 0,
  `priority`   ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  `status`     ENUM('To buy','Ordered','Received','Cancelled') NOT NULL DEFAULT 'To buy',
  PRIMARY KEY (`id`),
  KEY `idx_purchase_user` (`user_id`),
  KEY `idx_purchase_project` (`project_id`),
  CONSTRAINT `fk_purchase_user`    FOREIGN KEY (`user_id`)    REFERENCES `users` (`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_purchase_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Kanban tasks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `project_id` INT UNSIGNED NULL,
  `title`      VARCHAR(255) NOT NULL,
  `column`     ENUM('To Do','In Progress','Review','Done') NOT NULL DEFAULT 'To Do',
  `priority`   ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tasks_user` (`user_id`),
  KEY `idx_tasks_project` (`project_id`),
  CONSTRAINT `fk_tasks_user`    FOREIGN KEY (`user_id`)    REFERENCES `users` (`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Calendar events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `project_id` INT UNSIGNED NULL,
  `title`      VARCHAR(190) NOT NULL,
  `date`       DATE NOT NULL,
  `time`       TIME NULL COMMENT 'Start time — used for 1-hour-before reminders',
  `color`      VARCHAR(40) NOT NULL DEFAULT 'accent',
  `kind`       VARCHAR(60) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_events_user` (`user_id`),
  CONSTRAINT `fk_events_user`    FOREIGN KEY (`user_id`)    REFERENCES `users` (`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_events_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `icon`       VARCHAR(60) NOT NULL DEFAULT 'bell',
  `color`      VARCHAR(40) NOT NULL DEFAULT 'info',
  `text`       TEXT NOT NULL,
  `is_read`    TINYINT(1) NOT NULL DEFAULT 0,
  `event_id`   INT UNSIGNED NULL COMMENT 'Linked calendar event (for 1h-before reminders, avoids duplicates)',
  `project_id` INT UNSIGNED NULL COMMENT 'Linked project (for deadline-tomorrow reminders, avoids duplicates)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  KEY `idx_notifications_event` (`event_id`),
  KEY `idx_notifications_project` (`project_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- File folders (per project)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `file_folders` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `project_id` INT UNSIGNED NOT NULL,
  `name`       VARCHAR(120) NOT NULL,
  `file_count` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_file_folders_user` (`user_id`),
  KEY `idx_file_folders_project` (`project_id`),
  CONSTRAINT `fk_file_folders_user`    FOREIGN KEY (`user_id`)    REFERENCES `users` (`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_file_folders_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Project files (uploaded assets: photos, videos, contracts, deliverables)
-- Files live on disk under backend/uploads/; this table holds the metadata.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_files` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED NOT NULL,
  `project_id`    INT UNSIGNED NOT NULL,
  `folder_id`     INT UNSIGNED NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `stored_name`   VARCHAR(64) NOT NULL,
  `mime_type`     VARCHAR(120) NULL,
  `size`          BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project_files_project` (`project_id`),
  KEY `idx_project_files_folder` (`folder_id`),
  CONSTRAINT `fk_project_files_user`    FOREIGN KEY (`user_id`)    REFERENCES `users` (`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_project_files_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_files_folder`  FOREIGN KEY (`folder_id`)  REFERENCES `file_folders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
