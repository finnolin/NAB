CREATE TABLE `naming_project_affix` (
	`id` text PRIMARY KEY,
	`naming_project_id` text NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_naming_project_affix_naming_project_id_naming_project_id_fk` FOREIGN KEY (`naming_project_id`) REFERENCES `naming_project`(`id`) ON DELETE CASCADE,
	CONSTRAINT "naming_project_affix_type_check" CHECK("type" in ('prefix', 'suffix'))
);
--> statement-breakpoint
CREATE INDEX `naming_project_affix_projectId_idx` ON `naming_project_affix` (`naming_project_id`);