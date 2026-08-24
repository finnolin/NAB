CREATE TABLE `naming_project_user` (
	`id` text PRIMARY KEY,
	`naming_project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_naming_project_user_naming_project_id_naming_project_id_fk` FOREIGN KEY (`naming_project_id`) REFERENCES `naming_project`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_naming_project_user_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `naming_project_user_projectId_userId_uidx` ON `naming_project_user` (`naming_project_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `naming_project_user_userId_idx` ON `naming_project_user` (`user_id`);