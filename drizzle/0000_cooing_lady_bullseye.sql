CREATE TABLE `offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skill` varchar(255) NOT NULL,
	`audience` varchar(255) NOT NULL,
	`outcome` text NOT NULL,
	`model` varchar(24) NOT NULL,
	`title` varchar(255) NOT NULL,
	`promise` text NOT NULL,
	`deliverablesJson` text NOT NULL,
	`timeline` varchar(120) NOT NULL,
	`price` varchar(80) NOT NULL,
	`priceNote` varchar(160) NOT NULL,
	`outreach` text NOT NULL,
	`clarityScore` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `offers` ADD CONSTRAINT `offers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `offers_user_updated_idx` ON `offers` (`userId`,`updatedAt`);