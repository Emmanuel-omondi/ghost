-- GhostMonitor Supabase Schema (PostgreSQL)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS licenses (
    id            SERIAL PRIMARY KEY,
    parent_email  VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    expiry_date   TIMESTAMP,
    status        VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','blocked')),
    created_at    TIMESTAMP DEFAULT NOW(),
    login_history JSONB
);

CREATE TABLE IF NOT EXISTS conversations (
    id           SERIAL PRIMARY KEY,
    device_id    VARCHAR(64)  NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    app_type     VARCHAR(50)  NOT NULL,
    contact_id   VARCHAR(128) NOT NULL DEFAULT '',
    contact_name VARCHAR(255) NOT NULL DEFAULT '',
    thread_id    VARCHAR(64)  DEFAULT NULL,
    direction    VARCHAR(10)  NOT NULL DEFAULT 'RECEIVED' CHECK (direction IN ('SENT','RECEIVED')),
    content      TEXT,
    media_meta   JSONB        DEFAULT NULL,
    timestamp    BIGINT       NOT NULL,
    synced_at    BIGINT       DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_parent_app  ON conversations (parent_email, app_type);
CREATE INDEX IF NOT EXISTS idx_timestamp   ON conversations (timestamp);
CREATE INDEX IF NOT EXISTS idx_contact     ON conversations (parent_email, app_type, contact_id);

CREATE TABLE IF NOT EXISTS locations (
    id           SERIAL PRIMARY KEY,
    device_id    VARCHAR(64)  NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    lat          DOUBLE PRECISION NOT NULL,
    lng          DOUBLE PRECISION NOT NULL,
    accuracy     REAL         DEFAULT NULL,
    timestamp    BIGINT       NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parent_time ON locations (parent_email, timestamp);

CREATE TABLE IF NOT EXISTS devices (
    id           SERIAL PRIMARY KEY,
    device_id    VARCHAR(64)  NOT NULL UNIQUE,
    parent_email VARCHAR(255) NOT NULL,
    last_seen    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_parent ON devices (parent_email);
