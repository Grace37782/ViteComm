-- AlterTable
ALTER TABLE `Livraison` ADD COLUMN `dernier_scan_statut` VARCHAR(191) NULL,
ADD COLUMN `dernier_scan_message` VARCHAR(191) NULL,
ADD COLUMN `dernier_scan_at` DATETIME(3) NULL;
