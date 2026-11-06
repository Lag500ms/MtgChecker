/* ==========================================================================
   Flyway Migration: V2__rules_schema.sql
   Ensure rules tables exist when database was baselined at V1.
   ========================================================================== */

CREATE EXTENSION IF NOT EXISTS pg_trgm;

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
