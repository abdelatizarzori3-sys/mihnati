ALTER TABLE `offers` ADD COLUMN IF NOT EXISTS `clientName` varchar(160) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `offers` ADD COLUMN IF NOT EXISTS `sector` varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `offers` ADD COLUMN IF NOT EXISTS `tagsJson` varchar(1024) DEFAULT '[]' NOT NULL;
