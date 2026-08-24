CREATE TABLE `name_rating` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`first_name_id` text NOT NULL,
	`rating` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_name_rating_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_name_rating_first_name_id_first_name_id_fk` FOREIGN KEY (`first_name_id`) REFERENCES `first_name`(`id`) ON DELETE CASCADE,
	CONSTRAINT "name_rating_rating_check" CHECK("rating" in ('dislike', 'like', 'love'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `name_rating_userId_firstNameId_uidx` ON `name_rating` (`user_id`,`first_name_id`);--> statement-breakpoint
CREATE INDEX `name_rating_firstNameId_idx` ON `name_rating` (`first_name_id`);