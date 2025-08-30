# Stock Inventory System

## Overview
This is a complete CRUD (Create, Read, Update, Delete) system for managing stock inventory in a transport/grain management application.

## Features
- ✅ **Create**: Add new stock entries with dealer, grain, weight, units, etc.
- ✅ **Read**: View all stock entries in a table format
- ✅ **Update**: Edit existing stock entries
- ✅ **Delete**: Soft delete stock entries (sets status to Inactive)
- ✅ **Dynamic Dropdowns**: Dealers and grains are fetched from database
- ✅ **Form Validation**: Required field validation
- ✅ **Real-time Updates**: Data refreshes after operations
- ✅ **Search & Filter**: Search by dealer name

## Database Setup

### 1. Create the stockinventory table
Run the SQL script in `database_setup.sql` in your MySQL database:

```sql
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
```

### 2. Required Tables
Make sure you have these tables for dropdown data:
- `dealer` - for dealer/vendor options
- `itemsgrains` - for grain/item options

## API Endpoints

### GET `/api/stockinventory`
- **Purpose**: Fetch all active stock entries
- **Response**: Array of stock entries
- **Query**: `SELECT * FROM stockinventory WHERE status = "Active" ORDER BY created_at DESC`

### POST `/api/stockinventory`
- **Purpose**: Create new stock entry
- **Body**: Stock entry data (dealer, grain, units, weight, etc.)
- **Validation**: dealer, grain, units, weight are required

### PUT `/api/stockinventory`
- **Purpose**: Update existing stock entry
- **Body**: Stock entry data with ID
- **Validation**: ID is required

### DELETE `/api/stockinventory`
- **Purpose**: Soft delete stock entry
- **Body**: `{ "id": number }`
- **Action**: Sets status to "Inactive"

### PATCH `/api/stockinventory`
- **Purpose**: Update status
- **Body**: `{ "id": number, "status": "Active" | "Inactive" }`

## Component Structure

### 1. Page Component (`page.tsx`)
- Fetches dropdown data from APIs
- Passes data to StockInventory component
- Handles server-side data fetching

### 2. StockInventory Component (`Stockinventory.tsx`)
- Main component with form and table
- Handles all CRUD operations
- Manages form state and validation
- Integrates with API endpoints

## Usage

### Adding New Stock
1. Click "Add Stock" button
2. Fill in required fields (Dealer, Grain, Units, Weight)
3. Fill optional fields as needed
4. Click "Save" button

### Editing Stock
1. Click "Edit" button on any row
2. Modify the fields as needed
3. Click "Update" button

### Deleting Stock
1. Click "Delete" button on any row
2. Confirm deletion
3. Entry is soft deleted (status set to "Inactive")

## Form Fields

### Required Fields
- **Dealer/Vendor**: Selected from dealer table
- **Grain**: Selected from itemsgrains table  
- **Units**: kg, quintal, ton, bags
- **Weight**: Numeric value

### Optional Fields
- **E-Way Bill No**: Text input
- **Bill No**: Text input
- **Invoice Date**: Date picker
- **Truck No**: Text input
- **Rate**: Numeric input
- **Total Amount**: Numeric input
- **Remarks**: Textarea

## Error Handling
- Form validation with error messages
- API error handling with toast notifications
- Database connection error handling
- Graceful fallbacks for failed operations

## Dependencies
- Next.js 13+ with App Router
- MySQL database with mysql2
- React hooks (useState, useEffect, useMemo)
- Toast notifications (react-toastify)
- Custom context for modal management

## Environment Variables
Make sure these are set in your `.env.local`:
```
DB_HOST=localhost
DB_USER=your_username
DB_PASS=your_password
DB_NAME=your_database
DB_PORT=3306
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Notes
- All operations are logged with timestamps
- Soft delete is used (status field instead of actual deletion)
- Dropdown data is filtered to show only active items
- Form resets after successful operations
- Data refreshes automatically after CRUD operations
