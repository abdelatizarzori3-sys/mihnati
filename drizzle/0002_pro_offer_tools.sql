CREATE TABLE `offerTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`dataJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offerTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionEntitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`externalCustomerId` varchar(255),
	`externalSubscriptionId` varchar(255),
	`status` enum('active','past_due','cancelled','expired') NOT NULL,
	`currentPeriodEndsAt` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionEntitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptionEntitlements_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `subscriptionEntitlements_externalSubscriptionId_unique` UNIQUE(`externalSubscriptionId`)
);
--> statement-breakpoint
ALTER TABLE `offerTemplates` ADD CONSTRAINT `offerTemplates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptionEntitlements` ADD CONSTRAINT `subscriptionEntitlements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `offer_templates_user_updated_idx` ON `offerTemplates` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `subscription_entitlements_status_idx` ON `subscriptionEntitlements` (`status`,`currentPeriodEndsAt`);