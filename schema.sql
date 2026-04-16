-- GhostMonitor Database Schema
-- Run this once on a fresh database

CREATE TABLE IF NOT EXISTS licenses (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    parent_email  VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    expiry_date   DATETIME,
    status        ENUM('active','expired','blocked') DEFAULT 'active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_history JSON
);

CREATE TABLE IF NOT EXISTS conversations (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    device_id    VARCHAR(64)  NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    app_type     VARCHAR(50)  NOT NULL,
    contact_id   VARCHAR(128) NOT NULL DEFAULT '',
    contact_name VARCHAR(255) NOT NULL DEFAULT '',
    thread_id    VARCHAR(64)  DEFAULT NULL,
    direction    ENUM('SENT','RECEIVED') NOT NULL DEFAULT 'RECEIVED',
    content      TEXT,
    media_meta   JSON         DEFAULT NULL,
    timestamp    BIGINT       NOT NULL,
    synced_at    BIGINT       DEFAULT NULL,
    INDEX idx_parent_app  (parent_email, app_type),
    INDEX idx_timestamp   (timestamp),
    INDEX idx_contact     (parent_email, app_type, contact_id)
);

CREATE TABLE IF NOT EXISTS locations (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    device_id    VARCHAR(64)  NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    lat          DOUBLE       NOT NULL,
    lng          DOUBLE       NOT NULL,
    accuracy     FLOAT        DEFAULT NULL,
    timestamp    BIGINT       NOT NULL,
    INDEX idx_parent_time (parent_email, timestamp)
);

-- Device online/offline tracking
CREATE TABLE IF NOT EXISTS devices (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    device_id    VARCHAR(64)  NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    last_seen    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_device (device_id),
    INDEX idx_parent (parent_email)
);
