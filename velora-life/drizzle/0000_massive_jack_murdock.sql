CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`number` text NOT NULL,
	`items` text NOT NULL,
	`total` integer NOT NULL,
	`shipping` integer NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Alındı' NOT NULL,
	`tracking` text DEFAULT '' NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `idx_orders_user_created` ON `orders` (`user_id`,`created`);
CREATE INDEX `idx_orders_created` ON `orders` (`created`);
CREATE UNIQUE INDEX `idx_orders_number` ON `orders` (`number`);
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`partner` integer DEFAULT 0 NOT NULL,
	`referral` text NOT NULL,
	`sponsor` text DEFAULT '' NOT NULL,
	`cart` text DEFAULT '{}' NOT NULL,
	`created` integer NOT NULL
);

CREATE UNIQUE INDEX `idx_profiles_email` ON `profiles` (`email`);
CREATE UNIQUE INDEX `idx_profiles_referral` ON `profiles` (`referral`);
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
