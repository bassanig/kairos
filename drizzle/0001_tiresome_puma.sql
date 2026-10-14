CREATE TABLE `rooms` (
	`owner` text PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`api_hash` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_password_hash_unique` ON `rooms` (`password_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_api_hash_unique` ON `rooms` (`api_hash`);