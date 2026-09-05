-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 05, 2026 at 04:34 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ai_nirts`
--

-- --------------------------------------------------------

--
-- Table structure for table `incidents`
--

CREATE TABLE `incidents` (
  `incidentID` varchar(30) NOT NULL,
  `affectedIssue` varchar(255) NOT NULL,
  `classification` varchar(100) DEFAULT NULL,
  `connectionType` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `department` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `deviceType` varchar(100) DEFAULT NULL,
  `employeeName` varchar(150) NOT NULL,
  `issueCategory` varchar(100) NOT NULL,
  `location` varchar(255) NOT NULL,
  `resolvedAt` datetime DEFAULT NULL,
  `resolvedBy` varchar(150) DEFAULT NULL,
  `severity` enum('High','Medium','Low') NOT NULL DEFAULT 'Low',
  `status` enum('Pending','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Pending',
  `summary` text DEFAULT NULL,
  `troubleshooting` text DEFAULT NULL,
  `userId` varchar(50) NOT NULL,
  `assigned` enum('Yes','No') NOT NULL DEFAULT 'No',
  `assignedAt` datetime DEFAULT NULL,
  `assignedTo` varchar(50) DEFAULT NULL,
  `assignedToName` varchar(150) DEFAULT NULL,
  `durationMinutes` int(11) DEFAULT NULL,
  `resolutionNotes` text DEFAULT NULL,
  `startedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incidents`
--

INSERT INTO `incidents` (`incidentID`, `affectedIssue`, `classification`, `connectionType`, `createdAt`, `department`, `description`, `deviceType`, `employeeName`, `issueCategory`, `location`, `resolvedAt`, `resolvedBy`, `severity`, `status`, `summary`, `troubleshooting`, `userId`, `assigned`, `assignedAt`, `assignedTo`, `assignedToName`, `durationMinutes`, `resolutionNotes`, `startedAt`) VALUES
('INC-20260905-49CEB', 'RECORD SYSTEM', 'Network issue', 'Wi-Fi', '2026-09-05 13:36:46', 'Office of the City Accountant', 'THE PC CAN\'T CONNECT TO THE INTERNET', 'Desktop Computer', 'Employee', 'Network', '2ND FLOOR', NULL, NULL, 'Medium', 'In Progress', 'RECORD SYSTEM — THE PC CAN\'T CONNECT TO THE INTERNET', '1. Check the device and its network connection.\n2. Restart the device, then try again.\n3. Record any error message and send the report to IT.', '4', 'Yes', '2026-09-05 14:33:17', '3', 'IT Personnel', NULL, NULL, '2026-09-05 14:33:17');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userID` int(11) NOT NULL,
  `dateCreated` timestamp NOT NULL DEFAULT current_timestamp(),
  `department` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `employeeId` varchar(50) NOT NULL,
  `fullName` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profilePhoto` varchar(255) DEFAULT NULL,
  `role` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userID`, `dateCreated`, `department`, `email`, `employeeId`, `fullName`, `password`, `profilePhoto`, `role`, `status`) VALUES
(1, '2026-08-27 02:14:23', 'IT Department', 'admin@batangascity.gov.ph', 'ADMIN-001', 'System Administrator', '$2y$10$fhRoPSUT69/nANQSj8yRQuwQoDtSpRz3FuNeHNv2k0HwItnrIRgRW', 'user_1_1788596851_dd38188e91dcacc2.png', 'Admin', 'Active'),
(2, '2026-08-27 02:14:23', 'IT Department', 'secretary@batangascity.gov.ph', 'SEC-001', 'System Secretary', '$2y$10$i4/TyNui4mnZ1uoux8lI8.tQThj2mlXJQg37bjdYFbmHRxrtoKKlC', NULL, 'Secretary', 'Active'),
(3, '2026-09-01 10:54:34', 'Information Technology Services Division', 'itpersonnel@batangascity.gov.ph', 'IT-001', 'IT Personnel', '$2y$10$N4t4Gd6XI1r3aTRMTiaq9uIBNcnwAWMXGKRxl4FtoZbQ0bhOGZPLW', NULL, 'IT Personnel', 'Active'),
(4, '2026-09-01 10:57:21', 'Office of the City Accountant', 'employee@batangascity.gov.ph', 'EMP-001', 'Employee', '$2y$10$lsko7OG6g/PHox95QTHq/udHgWXd2g19Okk6ApI0HQPppBmWGj416', NULL, 'Employee', 'Active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `incidents`
--
ALTER TABLE `incidents`
  ADD PRIMARY KEY (`incidentID`),
  ADD KEY `idx_incidents_userId` (`userId`),
  ADD KEY `idx_incidents_status` (`status`),
  ADD KEY `idx_incidents_severity` (`severity`),
  ADD KEY `idx_incidents_createdAt` (`createdAt`),
  ADD KEY `idx_incidents_assignedTo` (`assignedTo`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userID`),
  ADD UNIQUE KEY `unique_email` (`email`),
  ADD UNIQUE KEY `unique_employeeId` (`employeeId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
