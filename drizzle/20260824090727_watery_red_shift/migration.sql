CREATE TABLE `first_name` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`rank_all_time` integer,
	`rank_recent` integer,
	`amount_all_time` integer DEFAULT 0 NOT NULL,
	`amount_recent` integer DEFAULT 0 NOT NULL
);
