-- Create stockinventory table
CREATE TABLE IF NOT EXISTS `stockinventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dealer` varchar(255) NOT NULL,
  `ewayBillNo` varchar(100) DEFAULT NULL,
  `billNo` varchar(100) DEFAULT NULL,
  `invoiceDate` date DEFAULT NULL,
  `truckNo` varchar(50) DEFAULT NULL,
  `grain` varchar(100) NOT NULL,
  `units` varchar(50) NOT NULL,
  `weight` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `totalAmount` decimal(12,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dealer` (`dealer`),
  KEY `idx_grain` (`grain`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional)
INSERT INTO `stockinventory` (`dealer`, `grain`, `units`, `weight`, `rate`, `totalAmount`, `remarks`) VALUES
('Shree Traders', 'Wheat', 'kg', 1000.00, 25.50, 25500.00, 'Sample wheat stock'),
('Om Agro', 'Rice', 'kg', 500.00, 30.00, 15000.00, 'Sample rice stock'),
('Maheshwari Grain', 'Oil', 'ltr', 100.00, 120.00, 12000.00, 'Sample oil stock');
