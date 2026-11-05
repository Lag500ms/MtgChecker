/* ==========================================================================
   Flyway Migration: V1__initial_schema.sql
   Initial schema for MtgChecker backend services.
   ========================================================================== */

CREATE EXTENSION IF NOT EXISTS pg_trgm;

/* --------------------------------------------------------------------------
   1. Accounts & RBAC
   -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(36) NOT NULL,
    permission VARCHAR(50) NOT NULL,
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission)
);

CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    discord_id VARCHAR(255) UNIQUE,
    token_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_roles (
    account_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    CONSTRAINT fk_account_roles_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
    CONSTRAINT fk_account_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    PRIMARY KEY (account_id, role_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

/* --------------------------------------------------------------------------
   2. Cards Catalog (Scryfall Cache)
   -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS cached_cards (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    oracle_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    set_code VARCHAR(10) NOT NULL,
    set_name VARCHAR(255),
    collector_number VARCHAR(20) NOT NULL,
    lang VARCHAR(10),
    mana_cost VARCHAR(100),
    type_line VARCHAR(255),
    oracle_text TEXT,
    rarity VARCHAR(50),
    power VARCHAR(20),
    toughness VARCHAR(20),
    loyalty VARCHAR(20),
    artist VARCHAR(255),
    flavor_text TEXT,
    released_at VARCHAR(20),
    scryfall_uri VARCHAR(500),
    raw_json TEXT,
    cached_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cached_cards_name ON cached_cards (name);
CREATE INDEX IF NOT EXISTS idx_cached_cards_normalized_name ON cached_cards (normalized_name);
CREATE INDEX IF NOT EXISTS idx_cached_cards_set_collector ON cached_cards (set_code, collector_number);
CREATE INDEX IF NOT EXISTS idx_cached_cards_oracle_id ON cached_cards (oracle_id);
CREATE INDEX IF NOT EXISTS idx_cached_cards_name_trgm ON cached_cards USING gin (lower(name) gin_trgm_ops);

/* --------------------------------------------------------------------------
   3. Decks & Formats
   -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS deck_formats (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    scryfall_key VARCHAR(50) NOT NULL,
    min_cards INT NOT NULL,
    max_cards INT,
    max_copies INT NOT NULL,
    has_commander BOOLEAN NOT NULL DEFAULT FALSE,
    has_sideboard BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decks (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    format_id VARCHAR(50) NOT NULL,
    commander_card_id VARCHAR(36),
    commander_card_name VARCHAR(255),
    cover_card_uri VARCHAR(500),
    partner_commander_card_id VARCHAR(36),
    partner_commander_card_name VARCHAR(255),
    partner_cover_card_uri VARCHAR(500),
    commander_color_identity VARCHAR(50),
    visibility VARCHAR(20) DEFAULT 'PUBLIC',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_decks_format FOREIGN KEY (format_id) REFERENCES deck_formats (id)
);

CREATE INDEX IF NOT EXISTS idx_decks_account_id ON decks (account_id);
CREATE INDEX IF NOT EXISTS idx_decks_format_id ON decks (format_id);

CREATE TABLE IF NOT EXISTS deck_cards (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    deck_id VARCHAR(36) NOT NULL,
    scryfall_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    set_code VARCHAR(20),
    collector_number VARCHAR(30),
    mana_cost VARCHAR(100),
    type_line VARCHAR(255),
    image_url VARCHAR(500),
    cmc DOUBLE PRECISION,
    quantity INT NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'MAINBOARD',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_deck_cards_deck FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards (deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_scryfall_id ON deck_cards (scryfall_id);

/* --------------------------------------------------------------------------
   4. Inventory & Collection Tracking
   -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS owned_cards (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL,
    scryfall_id VARCHAR(255) NOT NULL,
    oracle_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    set_code VARCHAR(10) NOT NULL,
    set_name VARCHAR(255) NOT NULL,
    collector_number VARCHAR(20) NOT NULL,
    finish VARCHAR(20) NOT NULL,
    lang VARCHAR(10) NOT NULL,
    condition VARCHAR(10) NOT NULL DEFAULT 'NM',
    acquired_price_usd VARCHAR(20),
    storage_location VARCHAR(100),
    quantity INT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT uk_owned_cards_account_printing_finish UNIQUE (account_id, scryfall_id, finish)
);

CREATE TABLE IF NOT EXISTS collection_snapshots (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL,
    snapshot_date DATE NOT NULL,
    total_value_usd NUMERIC(12, 2) NOT NULL,
    total_cards_count INT NOT NULL,
    unique_cards_count INT NOT NULL,
    created_at TIMESTAMP,
    CONSTRAINT uk_collection_snapshots_account_date UNIQUE (account_id, snapshot_date)
);

/* --------------------------------------------------------------------------
   5. Magic Rules & Adjudication System
   -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS cr_rules (
    rule_number VARCHAR(16) NOT NULL PRIMARY KEY,
    chapter_number VARCHAR(8) NOT NULL,
    chapter_title VARCHAR(128) NOT NULL,
    section_number INT NOT NULL,
    section_title VARCHAR(128) NOT NULL,
    rule_text TEXT NOT NULL,
    examples_text TEXT,
    cross_references TEXT
);

CREATE INDEX IF NOT EXISTS idx_cr_rules_chapter ON cr_rules (chapter_number);
CREATE INDEX IF NOT EXISTS idx_cr_rules_section ON cr_rules (section_number);

CREATE TABLE IF NOT EXISTS cr_glossary (
    term VARCHAR(128) NOT NULL PRIMARY KEY,
    definition TEXT NOT NULL,
    see_rule VARCHAR(64),
    is_obsolete BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS rules_formats (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    badge VARCHAR(64) NOT NULL,
    icon VARCHAR(64),
    summary TEXT,
    starting_life INT,
    min_deck_size INT,
    max_deck_size INT,
    key_rules_json TEXT,
    display_order INT
);

CREATE TABLE IF NOT EXISTS rules_quick_disputes (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    query VARCHAR(256) NOT NULL,
    card_names_json TEXT,
    verdict VARCHAR(32) NOT NULL,
    verdict_title VARCHAR(256) NOT NULL,
    summary TEXT,
    stack_steps_json TEXT,
    cr_rules_json TEXT,
    category VARCHAR(64),
    display_order INT
);

CREATE TABLE IF NOT EXISTS rules_cheat_sheets (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    subtitle VARCHAR(256),
    icon VARCHAR(32),
    badge VARCHAR(32),
    sections_json TEXT,
    display_order INT
);

CREATE TABLE IF NOT EXISTS rules_query_cache (
    id BIGSERIAL PRIMARY KEY,
    query_hash VARCHAR(64) NOT NULL UNIQUE,
    user_query TEXT NOT NULL,
    response_json TEXT NOT NULL,
    card_names VARCHAR(500),
    created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rules_cache_hash ON rules_query_cache (query_hash);
