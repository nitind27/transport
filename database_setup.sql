-- Create ZP Order Details table
CREATE TABLE IF NOT EXISTS zp_order_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(100) NOT NULL,
  no_of_days INT NOT NULL,
  period VARCHAR(100) NOT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Add indexes for better performance
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Optional: Add some sample data
INSERT INTO zp_order_details (order_no, no_of_days, period, status) VALUES
('ZP-001', 30, 'Monthly', 'Active'),
('ZP-002', 15, 'Bi-weekly', 'Active'),
('ZP-003', 7, 'Weekly', 'Active');
