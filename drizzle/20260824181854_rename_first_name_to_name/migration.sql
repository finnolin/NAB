PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `name_collection` (
	`id` text PRIMARY KEY,
	`label` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `naming_project` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_naming_project_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `naming_project_collection` (
	`id` text PRIMARY KEY,
	`naming_project_id` text NOT NULL,
	`collection_id` text NOT NULL,
	CONSTRAINT `fk_naming_project_collection_naming_project_id_naming_project_id_fk` FOREIGN KEY (`naming_project_id`) REFERENCES `naming_project`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_naming_project_collection_collection_id_name_collection_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `name_collection`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `name` (
	`id` text PRIMARY KEY,
	`collection_id` text NOT NULL,
	`name` text NOT NULL,
	`rank_all_time` integer,
	`rank_recent` integer,
	`amount_all_time` integer DEFAULT 0 NOT NULL,
	`amount_recent` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_name_collection_id_name_collection_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `name_collection`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `name_collection` (`id`, `label`) VALUES ('075bf508-23e9-4486-8703-a9485f84c545', 'Austrian Boy Names');
--> statement-breakpoint
INSERT INTO `naming_project` (`id`, `user_id`, `label`)
SELECT lower(hex(randomblob(16))), `id`, 'My Names' FROM `user`;
--> statement-breakpoint
INSERT INTO `naming_project_collection` (`id`, `naming_project_id`, `collection_id`)
SELECT lower(hex(randomblob(16))), `id`, '075bf508-23e9-4486-8703-a9485f84c545' FROM `naming_project`;
--> statement-breakpoint
INSERT INTO `name` (`id`, `collection_id`, `name`, `rank_all_time`, `rank_recent`, `amount_all_time`, `amount_recent`)
SELECT `id`, '075bf508-23e9-4486-8703-a9485f84c545', `name`, `rank_all_time`, `rank_recent`, `amount_all_time`, `amount_recent`
FROM `first_name`;
--> statement-breakpoint
CREATE UNIQUE INDEX `name_collectionId_name_uidx` ON `name` (`collection_id`,`name`);--> statement-breakpoint
CREATE INDEX `name_collectionId_idx` ON `name` (`collection_id`);--> statement-breakpoint
CREATE INDEX `naming_project_userId_idx` ON `naming_project` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `naming_project_collection_projectId_collectionId_uidx` ON `naming_project_collection` (`naming_project_id`,`collection_id`);--> statement-breakpoint
CREATE INDEX `naming_project_collection_collectionId_idx` ON `naming_project_collection` (`collection_id`);--> statement-breakpoint
CREATE TABLE `__new_name_rating` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`naming_project_id` text NOT NULL,
	`name_id` text NOT NULL,
	`rating` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_name_rating_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_name_rating_naming_project_id_naming_project_id_fk` FOREIGN KEY (`naming_project_id`) REFERENCES `naming_project`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_name_rating_name_id_name_id_fk` FOREIGN KEY (`name_id`) REFERENCES `name`(`id`) ON DELETE CASCADE,
	CONSTRAINT "name_rating_rating_check" CHECK("rating" in ('dislike', 'like', 'love'))
);
--> statement-breakpoint
INSERT INTO `__new_name_rating` (`id`, `user_id`, `naming_project_id`, `name_id`, `rating`, `created_at`, `updated_at`)
SELECT `nr`.`id`, `nr`.`user_id`, `np`.`id`, `nr`.`first_name_id`, `nr`.`rating`, `nr`.`created_at`, `nr`.`updated_at`
FROM `name_rating` `nr`
JOIN `naming_project` `np` ON `np`.`user_id` = `nr`.`user_id` AND `np`.`label` = 'My Names';
--> statement-breakpoint
DROP TABLE `name_rating`;
--> statement-breakpoint
ALTER TABLE `__new_name_rating` RENAME TO `name_rating`;
--> statement-breakpoint
CREATE UNIQUE INDEX `name_rating_namingProjectId_nameId_uidx` ON `name_rating` (`naming_project_id`,`name_id`);--> statement-breakpoint
CREATE INDEX `name_rating_nameId_idx` ON `name_rating` (`name_id`);--> statement-breakpoint
DROP TABLE `first_name`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
