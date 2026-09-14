CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created` integer NOT NULL
);

CREATE INDEX `idx_activity_entity` ON `activity` (`entity`,`entity_id`,`created`);
CREATE INDEX `idx_activity_created` ON `activity` (`created`);
CREATE TABLE `inventory` (
	`product_id` text PRIMARY KEY NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`reorder` integer DEFAULT 10 NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`change_token` text DEFAULT '' NOT NULL,
	`updated` integer NOT NULL
);

ALTER TABLE `orders` ADD `priority` text DEFAULT 'Normal' NOT NULL;
ALTER TABLE `orders` ADD `internal_note` text DEFAULT '' NOT NULL;
ALTER TABLE `orders` ADD `assigned_to` text DEFAULT '' NOT NULL;
ALTER TABLE `orders` ADD `payment_status` text DEFAULT 'Bekliyor' NOT NULL;
ALTER TABLE `orders` ADD `stock_booked` integer DEFAULT 0 NOT NULL;
ALTER TABLE `orders` ADD `version` integer DEFAULT 0 NOT NULL;
ALTER TABLE `orders` ADD `change_token` text DEFAULT '' NOT NULL;
ALTER TABLE `profiles` ADD `department` text DEFAULT '' NOT NULL;
ALTER TABLE `profiles` ADD `title` text DEFAULT '' NOT NULL;
ALTER TABLE `profiles` ADD `admin_note` text DEFAULT '' NOT NULL;
ALTER TABLE `profiles` ADD `segment` text DEFAULT 'Standart' NOT NULL;