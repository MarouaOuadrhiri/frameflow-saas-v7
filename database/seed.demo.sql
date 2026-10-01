-- ============================================================================
-- FrameFlow SaaS — demo seed data
-- Run on a FRESH database AFTER schema.sql:  mysql -u root -p frameflow < seed.sql
-- Demo login:  yassine@frameflow.studio  /  demo1234
-- NOTE: plain INSERTs — the database must be empty (or at least contain no
-- rows with these ids) before running this file.
-- ============================================================================

USE `frameflow`;
SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- Demo user (id = 1) — password is 'demo1234' (bcrypt, 10 rounds)
-- ----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `initials`) VALUES
(1, 'Yassine Bennani', 'yassine@frameflow.studio', '$2b$10$rNR7OUHYQ05i/27kBzLBauLlnmcEr/ENQUkMs/zlsUz3HDFpbpvDW', 'Director', 'YB');

-- ----------------------------------------------------------------------------
-- Clients
-- ----------------------------------------------------------------------------
INSERT INTO `clients` (`id`, `user_id`, `name`, `company`, `email`, `phone`) VALUES
(1, 1, 'Sarah & Yassine',     NULL,             'sarah.elamrani@gmail.com', '+212 661 22 33 44'),
(2, 1, 'Nova Records',        'Nova Records',   'contact@novarecords.ma',   '+212 522 11 22 33'),
(3, 1, 'Aura Cosmetics',      'Aura Cosmetics', 'marketing@aura.ma',        '+212 522 44 55 66'),
(4, 1, 'Yasmine Idrissi',      'Yasmine Studio', 'yasmine@studio.ma',        '+212 664 77 88 99'),
(5, 1, 'TechBridge Morocco',  'TechBridge',     'events@techbridge.ma',     '+212 537 22 44 66');

-- ----------------------------------------------------------------------------
-- Projects
-- ----------------------------------------------------------------------------
INSERT INTO `projects` (`id`, `user_id`, `client_id`, `name`, `type`, `status`, `thumb`, `deadline`, `price`, `paid`, `progress`) VALUES
(1, 1, 1, 'Wedding Story',            'Wedding Film',      'production',      'linear-gradient(135deg,#3a2a1f,#1a1410)', '2026-10-08', 12000,  9000, 72),
(2, 1, 2, 'NOVA — Music Video',       'Music Video',       'post-production', 'linear-gradient(135deg,#241a2e,#100a17)', '2026-09-29', 38000, 19000, 85),
(3, 1, 3, 'AURA — Brand Commercial',  'Commercial',        'planning',        'linear-gradient(135deg,#2e1f18,#150e0a)', '2026-11-02', 54000, 20000, 18),
(4, 1, 4, 'Fashion Editorial — Yasmine', 'Fashion Editorial', 'review',      'linear-gradient(135deg,#1c2432,#0d1119)', '2026-09-25',  9500,  9500, 94),
(5, 1, 5, 'TechBridge Summit',        'Corporate Event',   'completed',       'linear-gradient(135deg,#1a2a24,#0b120f)', '2026-08-14', 22000, 22000, 100),
(6, 1, 4, 'Café Bloom — Social Reel', 'Social / Reels',    'pre-production',  'linear-gradient(135deg,#2a1e1a,#130c0a)', '2026-10-20',  6000,  2000,  8);

-- Project team feature removed — no data.

-- ----------------------------------------------------------------------------
-- Equipment (14 items)
-- ----------------------------------------------------------------------------
INSERT INTO `equipment` (`id`, `user_id`, `name`, `brand`, `model`, `category`, `price`, `purchase_date`, `condition`, `damaged`) VALUES
( 1, 1, 'Sony A7 III',          'Sony',      NULL, 'Cameras',      15000, '2025-04-12', 'Excellent', 0),
( 2, 1, 'Sony A7S III',         'Sony',      NULL, 'Cameras',      32000, '2024-11-02', 'Excellent', 0),
( 3, 1, '24-70mm f/2.8 GM',     'Sony',      NULL, 'Lenses',       18500, '2024-06-20', 'Good',      0),
( 4, 1, '50mm f/1.4',           'Sony',      NULL, 'Lenses',        9200, '2024-06-20', 'Excellent', 0),
( 5, 1, 'DJI RS3 Gimbal',       'DJI',       NULL, 'Accessories',   6800, '2024-09-01', 'Good',      0),
( 6, 1, 'DJI Mavic 3',          'DJI',       NULL, 'Drones',       22000, '2024-03-15', 'Fair',      0),
( 7, 1, 'Rode Wireless GO II',  'Rode',      NULL, 'Audio',         2900, '2024-02-10', 'Damaged',   1),
( 8, 1, 'Aputure 300D II',      'Aputure',   NULL, 'Lighting',      9800, '2023-12-05', 'Excellent', 0),
( 9, 1, 'Manfrotto 055 Tripod', 'Manfrotto', NULL, 'Tripods',       2200, '2023-08-19', 'Good',      0),
(10, 1, 'Sony 64GB CFexpress',  'Sony',      NULL, 'Memory Cards',  1450, '2025-01-11', 'Excellent', 0),
(11, 1, 'V-Mount Battery 190Wh','IDX',       NULL, 'Batteries',     2600, '2024-05-08', 'Good',      0),
(12, 1, 'SSD 2TB T7',           'Samsung',   NULL, 'Storage',       2800, '2024-10-30', 'Excellent', 0),
(13, 1, 'Sennheiser MKH 416',   'Sennheiser',NULL, 'Audio',         8900, '2023-07-01', 'Excellent', 0),
(14, 1, 'Zhiyun Crane 3S',      'Zhiyun',    NULL, 'Accessories',   7200, '2023-05-22', 'Lost',      1);

-- ----------------------------------------------------------------------------
-- Expenses (Wedding Story)
-- ----------------------------------------------------------------------------
INSERT INTO `expenses` (`user_id`, `project_id`, `date`, `description`, `category`, `amount`, `payment_method`) VALUES
(1, 1, '2026-09-12', 'Drone insurance — one day',   'Equipment',  450, 'Card'),
(1, 1, '2026-09-10', 'Team transport — venue scouting', 'Transport', 320, 'Cash'),
(1, 1, '2026-09-06', 'Second shooter day rate',     'Staff',     1500, 'Transfer'),
(1, 1, '2026-09-02', 'Lens rental — 85mm f/1.4',    'Equipment',  600, 'Card');

-- ----------------------------------------------------------------------------
-- Payments (Wedding Story)
-- ----------------------------------------------------------------------------
INSERT INTO `payments` (`user_id`, `project_id`, `date`, `amount`, `method`, `notes`, `status`) VALUES
(1, 1, '2026-09-01',  3600, 'Bank transfer', 'Deposit',        'paid'),
(1, 1, '2026-09-14',  5400, 'Cash',          'Second payment', 'paid'),
(1, 2, '2026-08-20', 19000, 'Bank transfer', 'Deposit',        'paid'),
(1, 3, '2026-09-05', 20000, 'Bank transfer', 'Deposit',        'paid'),
(1, 4, '2026-09-12',  9500, 'Cash',          'Full payment',   'paid'),
(1, 5, '2026-08-01', 22000, 'Bank transfer', 'Final payment',  'paid'),
(1, 6, '2026-09-18',  2000, 'Cash',          'Deposit',        'paid');

-- ----------------------------------------------------------------------------
-- Purchase list
-- ----------------------------------------------------------------------------
INSERT INTO `purchase_items` (`user_id`, `project_id`, `item`, `category`, `qty`, `est_price`, `priority`, `status`) VALUES
(1, 1, 'Extra V-Mount Battery',            'Batteries',    2, 2600, 'High',   'To buy'),
(1, 1, '128GB CFexpress Card',             'Memory Cards', 3,  750, 'High',   'To buy'),
(1, 2, 'Rode Wireless GO II (replacement)','Audio',        1, 2900, 'Medium', 'Ordered'),
(1, 3, 'Zhiyun Crane 3S (replacement)',    'Accessories',  1, 7200, 'Medium', 'To buy'),
(1, 4, 'ND Filter Set 82mm',               'Accessories',  1, 1100, 'Low',    'Received');


-- ----------------------------------------------------------------------------
-- Equipment issues feature removed — no data.

-- ----------------------------------------------------------------------------
-- Kanban tasks
-- ----------------------------------------------------------------------------
INSERT INTO `tasks` (`user_id`, `project_id`, `title`, `column`, `priority`) VALUES
(1, 1, 'Scout ceremony venue lighting',       'To Do',      'high'),
(1, 3, 'Confirm drone permit for rooftop shoot','To Do',    'urgent'),
(1, 2, 'Draft shot list for chorus scene',    'To Do',      'medium'),
(1, 1, 'Color grade reception footage',       'In Progress','high'),
(1, 2, 'Sound design — bridge section',       'In Progress','medium'),
(1, 2, 'Client review — final trailer cut',   'Review',     'high'),
(1, 4, 'Approve retouched stills',            'Review',     'medium'),
(1, 5, 'Deliver highlight reel',              'Done',       'low'),
(1, 5, 'Upload raw files to archive',         'Done',       'low');


-- ----------------------------------------------------------------------------
-- Calendar events
-- ----------------------------------------------------------------------------
INSERT INTO `calendar_events` (`user_id`, `project_id`, `title`, `date`, `color`, `kind`) VALUES
(1, 3, 'AURA Shoot',        '2026-09-24', 'accent',  'Shoot'),
(1, 4, 'Client review',     '2026-09-25', 'warning', 'Review'),
(1, 2, 'NOVA deadline',     '2026-09-27', 'danger',  'Deadline'),
(1, 2, 'NOVA delivery',     '2026-09-29', 'success', 'Delivery'),
(1, 1, 'Payment due',       '2026-09-14', 'info',    'Payment'),
(1, 1, 'Wedding delivery',  '2026-10-08', 'success', 'Delivery');

-- ----------------------------------------------------------------------------
-- Notifications (4 rows, matching the app copy)
-- ----------------------------------------------------------------------------
INSERT INTO `notifications` (`user_id`, `icon`, `color`, `text`, `is_read`, `created_at`) VALUES
(1, 'payments',  'info',    'Payment of <b>3,000 DH</b> due in 2 days — Wedding Story.',                    0, NOW() - INTERVAL 10 MINUTE),
(1, 'issues',    'danger',  '3 equipment items missing for tomorrow''s AURA shoot.',                        0, NOW() - INTERVAL 1 HOUR),
(1, 'calendar',  'warning', 'Fashion Editorial deadline is tomorrow.',                                      0, NOW() - INTERVAL 3 HOUR),
(1, 'equipment', 'warning', 'Wedding Story is 12% above planned equipment budget.',                        0, NOW() - INTERVAL 1 DAY);

-- Activity log feature removed — no data.

-- ----------------------------------------------------------------------------
-- File folders (Wedding Story)
-- ----------------------------------------------------------------------------
INSERT INTO `file_folders` (`user_id`, `project_id`, `name`, `file_count`) VALUES
(1, 1, 'Photos',            24),
(1, 1, 'Videos',            12),
(1, 1, 'Documents',          6),
(1, 1, 'Contracts',          3),
(1, 1, 'Invoices',           8),
(1, 1, 'Final Deliverables',15);

-- ----------------------------------------------------------------------------
-- Project equipment checklist (Wedding Story)
-- ----------------------------------------------------------------------------
INSERT INTO `project_equipment` (`project_id`, `equipment_id`, `item_name`, `status`, `est_price`) VALUES
(1, 1,    'Sony A7 III',            'ok',      0),
(1, 3,    '24-70mm f/2.8 GM',       'ok',      0),
(1, NULL, 'Extra V-Mount Battery',  'missing', 2600),
(1, NULL, '128GB CFexpress Card',   'missing',  750),
(1, 7,    'Rode Wireless GO II',    'damaged', 2900),
(1, 9,    'Manfrotto 055 Tripod',   'ok',      0);
