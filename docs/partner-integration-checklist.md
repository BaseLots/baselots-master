# Partner B/D Integration Checklist

## API Requirements

### Data We Need FROM Partner
- [ ] Investor account creation confirmation
- [ ] KYC/AML verification status
- [ ] Accreditation status
- [ ] Investment transactions (real-time or daily batch)
- [ ] Distribution/dividend payments
- [ ] Signed subscription documents

### Data We Send TO Partner
- [ ] New investor registration
- [ ] Wallet address for token minting
- [ ] HSP beneficiary designations (if they support it)

## Technical Integration

### Authentication
- [ ] API key or OAuth2 setup
- [ ] Webhook endpoint security (verify signatures)
- [ ] Rate limits documented

### Data Sync Strategy
- [ ] Real-time webhooks for critical events (investments)
- [ ] Daily batch sync for non-critical data
- [ ] Reconciliation process for mismatches
- [ ] Retry logic for failed API calls

### Error Handling
- [ ] What happens if partner API is down?
- [ ] How do we handle webhook failures?
- [ ] Data validation rules

## Migration Planning

### Data Ownership
- [ ] Confirmed: BaseLots owns all investor data
- [ ] Partner provides full data export capability
- [ ] Export format: JSON/CSV/API access
- [ ] Historical data retention: ___ years

### Exit Terms
- [ ] Notice period for migration: ___ days
- [ ] Data export SLA: ___ business days
- [ ] Transfer agent coordination
- [ ] Investor notification requirements

## Compliance Continuity

### Regulatory Records
- [ ] KYC document retention (7 years required)
- [ ] Transaction audit trails
- [ ] Investor communication logs
- [ ] Accreditation verification records

### During Migration
- [ ] No interruption to investor access
- [ ] Dual-run period capability
- [ ] Rollback plan if issues arise

## Questions for Partner

1. **Do you have an existing API documentation portal?**
2. **What's your webhook retry policy?**
3. **Can you customize data fields for HSP integration?**
4. **Do you support blockchain/tokenized securities?**
5. **What's your disaster recovery/data backup process?**
6. **Can we embed your investment flow in an iframe?**
7. **What's the revenue/fee structure?**
   - Setup fee: $___
   - Monthly minimum: $___
   - Per-transaction: ___%
   - AUM fee: ___%

## Success Criteria

- [ ] Investor can sign up on BaseLots → seamlessly invest via partner
- [ ] Investment appears in BaseLots dashboard within 5 minutes
- [ ] All transactions logged in BaseLots database
- [ ] HSP beneficiary data captured (even if not used by partner yet)
- [ ] Can generate complete audit trail for any investor

## Timeline

- **Technical scoping call:** ___
- **API access granted:** ___
- **Integration dev start:** ___
- **Test environment ready:** ___
- **Production launch:** ___
