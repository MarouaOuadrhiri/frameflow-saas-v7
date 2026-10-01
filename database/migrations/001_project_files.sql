-- Migration 001: project_files table (run once on existing databases)
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
