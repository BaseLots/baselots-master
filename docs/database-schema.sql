-- BaseLots Source of Truth Database Schema
-- PostgreSQL (Supabase)
-- Designed for migration from partner B/D to in-house platform

-- ============================================
-- CORE INVESTOR DATA (Owned by BaseLots)
-- ============================================

CREATE TABLE investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    
    -- Wallet/Blockchain
    wallet_address VARCHAR(42) UNIQUE, -- ETH address (0x...)
    wallet_chain VARCHAR(20) DEFAULT 'arbitrum',
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    phone VARCHAR(20),
    date_of_birth DATE,
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    
    -- Partner Platform Integration
    partner_investor_id VARCHAR(100), -- Their internal ID
    partner_account_status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(50) DEFAULT 'system',
    
    -- Soft delete for compliance
    deleted_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_investors_email ON investors(email);
CREATE INDEX idx_investors_wallet ON investors(wallet_address);
CREATE INDEX idx_investors_partner_id ON investors(partner_investor_id);

-- ============================================
-- KYC & COMPLIANCE (Regulatory Records)
-- ============================================

CREATE TABLE kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    
    -- Verification Status
    status VARCHAR(50) NOT NULL, -- pending, verified, rejected, expired
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- KYC typically expires annually
    
    -- Document Types
    id_document_type VARCHAR(50), -- passport, drivers_license, etc.
    id_document_number VARCHAR(100),
    id_document_country VARCHAR(2),
    
    -- Verification Provider
    provider VARCHAR(50), -- partner_name, manual, future_provider
    provider_reference VARCHAR(255), -- ID in their system
    
    -- Compliance Flags
    pep_status VARCHAR(50), -- politically_exposed, not_exposed, unknown
    sanctions_check_passed BOOLEAN,
    sanctions_check_at TIMESTAMPTZ,
    
    -- Documents stored securely (S3/Supabase Storage)
    document_urls JSONB, -- {id_front: url, id_back: url, selfie: url}
    
    -- Audit trail
    notes TEXT,
    reviewed_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kyc_investor ON kyc_verifications(investor_id);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);

-- Accredited Investor Status
CREATE TABLE accredited_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    
    status VARCHAR(50) NOT NULL, -- pending, accredited, not_accredited, qualified_purchaser
    method VARCHAR(100), -- income, net_worth, professional_license, etc.
    
    -- Self-certification or verification
    self_certified BOOLEAN DEFAULT FALSE,
    verified_by_third_party BOOLEAN DEFAULT FALSE,
    third_party_provider VARCHAR(100),
    
    -- Financial thresholds (encrypted if stored)
    income_verification_type VARCHAR(50), -- w2, tax_return, bank_statement
    net_worth_verification_type VARCHAR(50), -- brokerage, bank_statement, appraisal
    
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_accredited_investor ON accredited_status(investor_id);

-- ============================================
-- PROPERTIES & OFFERINGS
-- ============================================

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Property Details
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    
    -- Legal Entity
    spv_name VARCHAR(255), -- Special Purpose Vehicle LLC
    spv_ein VARCHAR(20),
    spv_formation_date DATE,
    
    -- Financials
    total_value DECIMAL(15, 2), -- Total property value in USD
    total_shares INTEGER, -- Total BLOCKS tokens for this property
    share_price DECIMAL(10, 2), -- Price per BLOCK
    min_investment DECIMAL(10, 2), -- Minimum $ amount
    max_investment DECIMAL(10, 2), -- Per-investor cap
    
    -- Offering Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, open, funded, closed
    target_raise DECIMAL(15, 2),
    amount_raised DECIMAL(15, 2) DEFAULT 0,
    
    -- Timelines
    offering_opens_at TIMESTAMPTZ,
    offering_closes_at TIMESTAMPTZ,
    
    -- Smart Contract
    token_contract_address VARCHAR(42),
    token_contract_deployed_at TIMESTAMPTZ,
    
    -- Partner Integration
    partner_offering_id VARCHAR(100), -- ID in partner system
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_partner ON properties(partner_offering_id);

-- ============================================
-- INVESTMENTS & HOLDINGS
-- ============================================

CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    investor_id UUID NOT NULL REFERENCES investors(id),
    property_id UUID NOT NULL REFERENCES properties(id),
    
    -- Investment Details
    shares_purchased INTEGER NOT NULL,
    price_per_share DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    
    -- Funding
    payment_method VARCHAR(50), -- wire, ach, crypto, check
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, received, cleared, failed
    
    -- Partner Integration
    partner_transaction_id VARCHAR(100), -- Transaction ID in partner system
    partner_subscription_doc_url TEXT, -- Signed subscription agreement
    
    -- Smart Contract
    token_mint_tx_hash VARCHAR(66), -- Blockchain transaction hash
    tokens_minted_at TIMESTAMPTZ,
    
    -- Important: This is YOUR record, partner has their own
    investment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_shares CHECK (shares_purchased > 0),
    CONSTRAINT positive_amount CHECK (total_amount > 0)
);

CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_investments_property ON investments(property_id);
CREATE INDEX idx_investments_partner ON investments(partner_transaction_id);

-- Current Holdings View (calculated)
CREATE VIEW investor_holdings AS
SELECT 
    i.investor_id,
    i.property_id,
    p.name as property_name,
    SUM(i.shares_purchased) as total_shares,
    SUM(i.total_amount) as total_invested,
    AVG(i.price_per_share) as avg_purchase_price
FROM investments i
JOIN properties p ON i.property_id = p.id
WHERE i.payment_status = 'cleared'
GROUP BY i.investor_id, i.property_id, p.name;

-- ============================================
-- HERITAGE SHIELD PROTOCOL (HSP)
-- ============================================

CREATE TABLE hsp_beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The investor who owns the assets
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    
    -- Beneficiary Details
    beneficiary_type VARCHAR(50) NOT NULL, -- individual, trust, entity
    
    -- Individual beneficiary
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    
    -- Relationship
    relationship VARCHAR(50), -- spouse, child, sibling, friend, trust, other
    relationship_other VARCHAR(100),
    
    -- Wallet where tokens will be transferred
    beneficiary_wallet_address VARCHAR(42),
    wallet_verified BOOLEAN DEFAULT FALSE,
    wallet_verified_at TIMESTAMPTZ,
    
    -- Allocation (can be % across multiple beneficiaries)
    allocation_percentage DECIMAL(5, 2) NOT NULL CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    
    -- Priority order (primary, secondary, etc.)
    priority INTEGER DEFAULT 1,
    
    -- Smart Contract
    on_chain_designation_tx VARCHAR(66), -- Transaction hash when added to contract
    contract_beneficiary_id INTEGER, -- ID in HeritageShield.sol
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, revoked, executed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hsp_investor ON hsp_beneficiaries(investor_id);
CREATE INDEX idx_hsp_wallet ON hsp_beneficiaries(beneficiary_wallet_address);

-- HSP Execution Log (when death trigger occurs)
CREATE TABLE hsp_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    deceased_investor_id UUID NOT NULL REFERENCES investors(id),
    
    -- Trigger Details
    trigger_source VARCHAR(50), -- oracle, manual, legal_document
    death_verification_doc_url TEXT,
    verification_confirmed_by VARCHAR(100),
    
    -- Challenge Period
    challenge_period_started_at TIMESTAMPTZ,
    challenge_period_ends_at TIMESTAMPTZ, -- 90 days later
    challenged BOOLEAN DEFAULT FALSE,
    challenge_resolved_at TIMESTAMPTZ,
    
    -- Execution
    executed_at TIMESTAMPTZ,
    execution_tx_hash VARCHAR(66),
    
    -- Transfers made
    transfers JSONB, -- [{beneficiary_id, shares_transferred, tx_hash}]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DIVIDENDS & DISTRIBUTIONS
-- ============================================

CREATE TABLE distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    
    -- Distribution Details
    distribution_type VARCHAR(50), -- rental_income, sale_proceeds, refinance, other
    period_start DATE,
    period_end DATE,
    total_amount DECIMAL(15, 2),
    
    -- Per-share calculation
    amount_per_share DECIMAL(10, 4),
    
    -- Status
    status VARCHAR(50) DEFAULT 'calculated', -- calculated, pending, paid
    paid_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE investor_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES investors(id),
    distribution_id UUID NOT NULL REFERENCES distributions(id),
    investment_id UUID NOT NULL REFERENCES investments(id),
    
    shares_held INTEGER,
    amount_due DECIMAL(15, 2),
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    
    payment_status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG (Everything for Regulators)
-- ============================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- insert, update, delete
    
    old_values JSONB,
    new_values JSONB,
    
    performed_by VARCHAR(100), -- user ID or 'system'
    performed_by_type VARCHAR(50), -- investor, admin, system, api
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================
-- MIGRATION TRACKING
-- ============================================

CREATE TABLE platform_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    migration_type VARCHAR(50) NOT NULL, -- partner_to_internal, internal_upgrade
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    source_system VARCHAR(100),
    target_system VARCHAR(100),
    
    records_migrated INTEGER,
    records_failed INTEGER,
    
    status VARCHAR(50) DEFAULT 'pending',
    error_log TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON investors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_updated_at BEFORE UPDATE ON kyc_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accredited_updated_at BEFORE UPDATE ON accredited_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hsp_beneficiaries_updated_at BEFORE UPDATE ON hsp_beneficiaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Investors can only see their own data
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY investors_isolation ON investors
    FOR ALL
    USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' = 'admin');

-- Similar policies for other tables...
-- (Add as needed based on your auth setup)

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE investors IS 'Master record of all investors - source of truth regardless of which platform processes investments';
COMMENT ON TABLE kyc_verifications IS 'KYC status and document references - required for regulatory audits';
COMMENT ON TABLE investments IS 'Investment transactions - links to partner platform via partner_transaction_id';
COMMENT ON TABLE hsp_beneficiaries IS 'Heritage Shield Protocol beneficiary designations - unique BaseLots feature';
COMMENT ON TABLE audit_log IS 'Complete audit trail for regulatory compliance and dispute resolution';
