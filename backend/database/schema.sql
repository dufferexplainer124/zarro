-- Zarro Beauty E-commerce — MySQL Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS zarro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zarro_db;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- BRANDS ----------
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  logo_url VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- CATEGORIES ----------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- PRODUCTS ----------
-- price = regular price. discount_price = optional sale price (must be lower than price to take effect).
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) DEFAULT NULL,
  stock INT NOT NULL DEFAULT 0,
  sku VARCHAR(80) UNIQUE,
  image_url VARCHAR(500),
  brand_id INT NOT NULL,
  category_id INT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FULLTEXT KEY ft_product_search (name, description)
) ENGINE=InnoDB;

-- ---------- PRODUCT IMAGES (gallery) ----------
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- CART (persisted in MySQL, one row per user+product) ----------
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_number VARCHAR(40) NOT NULL UNIQUE,

  -- Customer info captured at order time (kept even if the account later changes)
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,

  status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',

  subtotal DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  payment_method ENUM('cod','visa','mastercard','easypaisa','jazzcash') NOT NULL DEFAULT 'cod',
  payment_status ENUM('unpaid','pending','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',

  shipping_address VARCHAR(255) NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100) NOT NULL DEFAULT 'Pakistan',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- ORDER ITEMS ----------
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(200) NOT NULL,
  product_image VARCHAR(500),
  brand_name VARCHAR(120),
  price DECIMAL(10,2) NOT NULL,        -- effective unit price at time of order (discount applied if any)
  quantity INT NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- PAYMENT TRANSACTIONS ----------
-- One row per payment attempt for an order. Never stores card numbers or CVV —
-- only gateway-issued references and status. See backend/services/paymentService.js.
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  provider ENUM('visa','mastercard','easypaisa','jazzcash') NOT NULL,
  mode ENUM('test','live') NOT NULL,
  provider_reference VARCHAR(120),
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'PKR',
  status ENUM('initiated','pending','succeeded','failed','cancelled') NOT NULL DEFAULT 'initiated',
  raw_response JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- SEED DATA ----------
INSERT INTO brands (name, slug, description) VALUES
('Glowbie', 'glowbie', 'Clean, dermatologist-tested skincare.'),
('Velour Cosmetics', 'velour-cosmetics', 'Bold pigmented makeup for every skin tone.'),
('Nectar & Bloom', 'nectar-and-bloom', 'Botanical haircare crafted from natural oils.'),
('Lumé', 'lume', 'Minimalist fragrance house.');

INSERT INTO categories (name, slug, description) VALUES
('Skincare', 'skincare', 'Cleansers, serums, moisturizers and more.'),
('Makeup', 'makeup', 'Face, eyes and lip products.'),
('Haircare', 'haircare', 'Shampoo, conditioner and styling.'),
('Fragrance', 'fragrance', 'Perfumes and body mists.');

INSERT INTO products (name, slug, description, price, discount_price, stock, sku, image_url, brand_id, category_id, rating) VALUES
('Hydrating Vitamin C Serum', 'hydrating-vitamin-c-serum', 'A brightening serum with 15% vitamin C to even skin tone and boost radiance.', 34.00, 28.00, 120, 'GLW-SER-001', '/images/products/vitamin-c-serum.jpg', 1, 1, 4.6),
('Gentle Foaming Cleanser', 'gentle-foaming-cleanser', 'A sulfate-free daily cleanser that removes impurities without stripping skin.', 18.50, NULL, 200, 'GLW-CLN-002', '/images/products/foaming-cleanser.jpg', 1, 1, 4.4),
('Velvet Matte Lipstick', 'velvet-matte-lipstick', 'Long-wearing, richly pigmented matte lipstick in a universally flattering red.', 22.00, NULL, 150, 'VEL-LIP-001', '/images/products/matte-lipstick.jpg', 2, 2, 4.7),
('Featherweight Foundation', 'featherweight-foundation', 'Buildable, breathable foundation with a natural satin finish.', 36.00, 32.00, 90, 'VEL-FND-002', '/images/products/foundation.jpg', 2, 2, 4.5),
('Argan Repair Shampoo', 'argan-repair-shampoo', 'Sulfate-free shampoo infused with argan oil for damaged, dry hair.', 19.00, NULL, 180, 'NEC-SHM-001', '/images/products/argan-shampoo.jpg', 3, 3, 4.3),
('Rosemary Growth Oil', 'rosemary-growth-oil', 'Lightweight scalp oil that supports fuller-looking hair over time.', 24.00, NULL, 110, 'NEC-OIL-002', '/images/products/rosemary-oil.jpg', 3, 3, 4.6),
('Amber Musk Eau de Parfum', 'amber-musk-eau-de-parfum', 'A warm, woody fragrance with notes of amber, musk and sandalwood.', 80.00, 68.00, 60, 'LUM-EDP-001', '/images/products/amber-musk.jpg', 4, 4, 4.8),
('Citrus Bloom Body Mist', 'citrus-bloom-body-mist', 'A fresh, light layering mist with notes of bergamot and white tea.', 24.00, NULL, 140, 'LUM-MST-002', '/images/products/citrus-mist.jpg', 4, 4, 4.2),
('Overnight Retinol Cream', 'overnight-retinol-cream', 'A gentle nightly retinol treatment that smooths fine lines while you sleep.', 38.00, NULL, 75, 'GLW-CRM-003', '/images/products/retinol-cream.jpg', 1, 1, 4.5),
('Precision Eyeliner Pen', 'precision-eyeliner-pen', 'Waterproof, smudge-proof liquid liner with an ultra-fine tip.', 16.00, NULL, 160, 'VEL-EYE-003', '/images/products/eyeliner.jpg', 2, 2, 4.4),
('Silk Hair Mask', 'silk-hair-mask', 'A weekly deep-conditioning mask that restores shine and softness.', 26.00, 21.00, 95, 'NEC-MSK-003', '/images/products/hair-mask.jpg', 3, 3, 4.7),
('Vetiver & Sea Salt Cologne', 'vetiver-sea-salt-cologne', 'A crisp, oceanic scent balanced with earthy vetiver.', 72.00, NULL, 50, 'LUM-EDP-003', '/images/products/vetiver-cologne.jpg', 4, 4, 4.6);

-- No admin user is seeded here because bcrypt hashes cannot be written safely by hand.
-- After running this schema, create the admin account with:  npm run seed
-- (see backend/database/seed.js) — default login will be admin@zarro.com / Admin@123
