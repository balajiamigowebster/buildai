CREATE DATABASE IF NOT EXISTS buildit_db;
USE buildit_db;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS material_bills;
DROP TABLE IF EXISTS client_receipts;
DROP TABLE IF EXISTS projects;

-- Projects Table
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  budget DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status ENUM('active', 'upcoming', 'completed') NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  built_up_area DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  progress INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Receipts (Inflows) Table
CREATE TABLE client_receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  date_received DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  milestone VARCHAR(255) NOT NULL,
  ref_num VARCHAR(100),
  received_from VARCHAR(255) NOT NULL,
  memo TEXT,
  recorded_by VARCHAR(100) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Material Bills (Expenses/Outflows) Table
CREATE TABLE material_bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  phase_tag VARCHAR(100) NOT NULL, -- Foundation, Brickwork, Plastering, Flooring, Electrical, Painting
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  invoice_ref VARCHAR(100),
  payment_status ENUM('paid', 'pending') NOT NULL DEFAULT 'paid',
  date_logged DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Seed Projects Data
INSERT INTO projects (id, name, location, client_name, budget, status, start_date, built_up_area, progress) VALUES
(1, 'The Grand Horizon Towers', 'Worli Sea Face, Mumbai', 'Ashoka Living Properties (GHT-01)', 45000000.00, 'active', '2026-01-15', 185000.00, 95),
(2, 'Emerald Tech Park - Phase 2', 'Whitefield, Bengaluru', 'Nexus Infrastructure Corp (ETP-02)', 62000000.00, 'active', '2026-03-20', 348000.00, 75),
(3, 'Aura Urban Villas (Enclave 4)', 'Banjara Hills, Hyderabad', 'Aura Developers (AUV-04)', 32000000.00, 'upcoming', '2026-09-10', 120000.00, 0),
(4, 'Vanguard Industrial Logistics Hub', 'Chakan Industrial Zone, Pune', 'Vanguard Logistics (VIL-09)', 30000000.00, 'upcoming', '2026-09-01', 157000.00, 0);

-- Seed Client Receipts for Grand Horizon Towers (Project 1)
-- Total inflow collected = 2,92,50,000 (which is 65% of 4,50,00,000)
INSERT INTO client_receipts (project_id, amount, date_received, payment_method, milestone, ref_num, received_from, memo, recorded_by) VALUES
(1, 15000000.00, '2026-02-20', 'Bank / RTGS', 'Foundation Raft & Basement Slab Release', 'HDFC-RTGS-9988231', 'Ashoka Living Properties', 'Stage 1 billing milestone cleared via direct RTGS', 'Thiru (Admin)'),
(1, 14250000.00, '2026-06-10', 'Bank / RTGS', 'Podium & 10th Floor Structural Milestone', 'ICICI-NEFT-4412098', 'Ashoka Living Properties', 'Stage 2 milestone payment after architect inspection', 'Thiru (Admin)');

-- Seed Client Receipts for Emerald Tech Park (Project 2)
-- Inflow = 3,85,00,000
INSERT INTO client_receipts (project_id, amount, date_received, payment_method, milestone, ref_num, received_from, memo, recorded_by) VALUES
(2, 38500000.00, '2026-04-15', 'Bank / RTGS', 'Excavation & Shoring Milestone', 'SBI-RTGS-1122334', 'Nexus Infrastructure Corp', 'Initial mobilization and excavation clearance', 'Thiru (Admin)');

-- Seed Material Bills for Grand Horizon Towers (Project 1)
-- Total spent = 1,35,00,262.
-- Foundation bills (1,71,000 + 7,87,500 = 9,58,500)
INSERT INTO material_bills (project_id, item_name, phase_tag, quantity, unit, amount, vendor, invoice_ref, payment_status, date_logged) VALUES
(1, 'UltraTech OPC 53 Grade Cement', 'Foundation', 450.00, 'Bags', 171000.00, 'Mahalaxmi Building Supplies', 'MNRS-8821', 'paid', '2026-08-18'),
(1, 'TMT Steel Rebars', 'Foundation', 12.00, 'Tons', 787500.00, 'Mahalaxmi Building Supplies', 'TMT-552', 'pending', '2026-08-20');

-- Other bills for Grand Horizon Towers to sum to 1,35,00,262
INSERT INTO material_bills (project_id, item_name, phase_tag, quantity, unit, amount, vendor, invoice_ref, payment_status, date_logged) VALUES
(1, 'Red Clay Bricks', 'Brickwork', 50000.00, 'Pcs', 500000.00, 'Local Brick Kiln', 'BRK-990', 'paid', '2026-08-21'),
(1, 'River Sand', 'Brickwork', 5.00, 'Brass', 150000.00, 'Sand Quarry Corp', 'SND-441', 'paid', '2026-08-22'),
(1, 'Gypsum Plaster Bags', 'Plastering', 800.00, 'Bags', 320000.00, 'Gypsum Industries', 'GYP-102', 'paid', '2026-08-23'),
(1, 'Vitrified Floor Tiles (2x2)', 'Flooring', 12000.00, 'Sq.Ft', 1800000.00, 'Kajaria Ceramics', 'KAJ-4432', 'paid', '2026-08-24'),
(1, 'Finolex Copper Wires & PVC Conduits', 'Electrical', 1.00, 'Lot', 1250000.00, 'Finolex Distributors', 'FIN-882', 'paid', '2026-08-24'),
(1, 'Asian Paints Apex Ultima (Exterior)', 'Painting', 1500.00, 'Litres', 7622762.00, 'Asian Paints Hub', 'AP-0092', 'paid', '2026-08-25');

-- Seed Material Bills for Emerald Tech Park (Project 2)
-- Total spent = 3,82,56,000 (which sums with 1,35,00,262 to 5,17,56,262)
-- Let's add various bills for Project 2
INSERT INTO material_bills (project_id, item_name, phase_tag, quantity, unit, amount, vendor, invoice_ref, payment_status, date_logged) VALUES
(2, 'Ready Mix Concrete M40', 'Foundation', 500.00, 'Cu.M', 2500000.00, 'L&T Concrete', 'RMC-101', 'paid', '2026-04-20'),
(2, 'Structural Steel H-Beams', 'Foundation', 45.00, 'Tons', 3825600.00, 'Tata Steel Ltd', 'TATA-881', 'paid', '2026-04-25'),
(2, 'Premium Hollow Blocks', 'Brickwork', 80000.00, 'Pcs', 1600000.00, 'Solid Block Makers', 'SBM-339', 'paid', '2026-05-10'),
(2, 'Double Charged Floor Tiles', 'Flooring', 25000.00, 'Sq.Ft', 5000000.00, 'Somany Ceramics', 'SOM-9921', 'paid', '2026-06-05'),
(2, 'Modular Electrical Switches & Panels', 'Electrical', 1.00, 'Lot', 4500000.00, 'Schneider Electric', 'SE-4421', 'paid', '2026-07-15'),
(2, 'External Glass Facade Glazing Panels', 'Painting', 1.00, 'Lot', 20830400.00, 'Saint Gobain Glass', 'SGG-8822', 'paid', '2026-08-10');
