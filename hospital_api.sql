/*!40101 SET NAMES utf8 */;
/*!40101 SET SQL_MODE=''*/;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;

-- Buat database (gunakan collation yang kompatibel)
CREATE DATABASE IF NOT EXISTS `hospital_api` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

USE `hospital_api`;

-- ======================
-- TABLE: doctors
-- ======================
DROP TABLE IF EXISTS `doctors`;

CREATE TABLE `doctors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `doctors` (`id`, `name`, `specialization`, `phone`) VALUES
(1, 'dr. Andi Wijaya', 'Umum', '081111111111'),
(2, 'dr. Sari Dewi', 'Anak', '082222222222'),
(3, 'dr. Budi Santoso', 'Jantung', '083333333333'),
(4, 'dr. Citra Lestari', 'Kulit', '084444444444');

-- ======================
-- TABLE: patients
-- ======================
DROP TABLE IF EXISTS `patients`;

CREATE TABLE `patients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `nik` varchar(16) NOT NULL,
  `birth_date` date NOT NULL,
  `gender` enum('Laki-laki','Perempuan') NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nik` (`nik`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `patients` (`id`, `name`, `nik`, `birth_date`, `gender`, `phone`, `address`) VALUES
(1, 'Ahmad Fauzi', '3578010101990001', '1999-01-01', 'Laki-laki', '089999999999', 'Jl. Baru No. 99 Surabaya'),
(2, 'Siti Rahayu', '3578010202000002', '2000-02-02', 'Perempuan', '085222222222', 'Jl. Gubeng No. 5'),
(3, 'Dewi Putri', '3578010303010003', '2001-03-03', 'Perempuan', '085333333333', 'Jl. Pemuda No. 15 Surabaya');

-- ======================
-- TABLE: appointments
-- ======================
DROP TABLE IF EXISTS `appointments`;

CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `appointment_date` datetime NOT NULL,
  `complaint` text,
  `status` enum('pending','done','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `appointment_date`, `complaint`, `status`) VALUES
(1, 1, 1, '2025-04-05 09:00:00', 'Demam dan batuk', 'done'),
(2, 2, 2, '2025-04-05 10:00:00', 'Kontrol rutin anak', 'pending'),
(3, 1, 2, '2026-04-10 09:00:00', 'Sakit kepala dan pusing', 'pending');

-- ======================
-- TABLE: users (LENGKAP dengan API Key)
-- ======================
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gender` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `api_key` varchar(100) DEFAULT NULL,
  `api_key_created_at` timestamp NULL DEFAULT NULL,
  `api_key_expires_at` timestamp NULL DEFAULT NULL,
  `role` enum('admin','staff','doctor') DEFAULT 'staff',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `api_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert user ADMIN (password: admin123)
-- Hash ini adalah hash untuk 'admin123' yang benar
INSERT INTO `users` (`username`, `fullname`, `email`, `phone`, `gender`, `password`, `role`, `is_active`) VALUES
('admin', 'Administrator', 'admin@hospital.com', '08123456789', 'Laki-laki', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- ======================
-- AKTIFKAN FOREIGN KEY
-- ======================
SET FOREIGN_KEY_CHECKS=1;

-- ======================
-- TAMPILKAN SEMUA DATA
-- ======================
SELECT '✅ Database berhasil dibuat!' AS Status;
SELECT COUNT(*) AS Total_Doctors FROM doctors;
SELECT COUNT(*) AS Total_Patients FROM patients;
SELECT COUNT(*) AS Total_Appointments FROM appointments;
SELECT COUNT(*) AS Total_Users FROM users;