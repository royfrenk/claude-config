# Legal Review Agent Guide

> A legal risk assessment companion for PRD creation. Use this guide to identify potential legal issues, assess risk levels, and ensure compliance with US consumer protection, privacy, and competition laws.

**Disclaimer**: This guide provides a framework for identifying potential legal considerations. It is not legal advice. Always consult qualified legal counsel for specific legal questions.

---

## How to Use This Guide

When reviewing a PRD for legal risks:
1. **Categorize** → Identify which legal domains apply
2. **Assess** → Evaluate risk in each applicable area
3. **Score** → Assign a risk tier to each issue
4. **Document** → Record findings and mitigations
5. **Escalate** → Flag Critical/High items for legal review

---

## Risk Scoring System

### Risk Tiers

| Tier | Description | Action Required |
|------|-------------|-----------------|
| **🔴 Critical** | Immediate legal exposure, potential regulatory action, litigation risk | Stop and consult legal counsel before proceeding |
| **🟠 High** | Significant compliance gaps, likely requires legal review | Requires legal sign-off before launch |
| **🟡 Medium** | Potential issues that need attention, gray areas | Address before launch, document decisions |
| **🟢 Low** | Minor considerations, best practices | Note for awareness, proceed with documentation |

### Risk Factors

Each issue should be evaluated on:

| Factor | Questions |
|--------|-----------|
| **Regulatory exposure** | Is there an applicable law? What are the penalties? |
| **Enforcement activity** | Is the FTC/state AG actively pursuing this? |
| **Litigation history** | Have companies been sued for similar practices? |
| **User harm potential** | Could users suffer financial, privacy, or other harm? |
| **Reputational impact** | Would this make headlines if discovered? |
| **Reversibility** | Can we fix this post-launch, or is harm permanent? |

---

## Part 1: Privacy & Data Protection

### Key US Privacy Laws

| Law | Applies To | Key Requirements |
|-----|------------|------------------|
| **CCPA/CPRA** (California) | Businesses with CA users meeting thresholds | Right to know, delete, opt-out of sale; privacy policy requirements |
| **VCDPA** (Virginia) | Businesses with VA users meeting thresholds | Similar to CCPA with some variations |
| **CPA** (Colorado) | Businesses with CO users meeting thresholds | Consent for sensitive data, universal opt-out |
| **CTDPA** (Connecticut) | Businesses with CT users meeting thresholds | Similar framework to above |
| **FTC Act Section 5** | All US businesses | Prohibits unfair/deceptive practices |
| **COPPA** | Services directed at or knowingly collecting from children <13 | Parental consent, special protections |
| **HIPAA** | Health data handlers | Strict health information protections |
| **FERPA** | Educational institutions | Student record protections |

### Privacy Risk Checklist

**Data Collection**
- [ ] What personal data are we collecting?
- [ ] Is each data point necessary for the stated purpose?
- [ ] Are we collecting sensitive data (health, financial, biometric, precise location)?
- [ ] Could this service attract children under 13?
- [ ] Is collection disclosed in our privacy policy?

**Risk Indicators:**
| Scenario | Risk Level |
|----------|------------|
| Collecting data not disclosed in privacy policy | 🔴 Critical |
| Collecting sensitive data without explicit consent | 🔴 Critical |
| Possible child users without COPPA compliance | 🔴 Critical |
| Collecting more data than necessary for purpose | 🟠 High |
| No clear purpose stated for data collection | 🟠 High |
| Collecting non-sensitive data with proper disclosure | 🟢 Low |

**Data Use & Sharing**
- [ ] How will the data be used?
- [ ] Will data be shared with third parties?
- [ ] Will data be sold (broadly defined under CCPA)?
- [ ] Is data used for profiling or automated decisions?
- [ ] Is data used for purposes beyond user expectations?

**Risk Indicators:**
| Scenario | Risk Level |
|----------|------------|
| Selling data without opt-out mechanism | 🔴 Critical |
| Sharing data with third parties not disclosed | 🔴 Critical |
| Using data for undisclosed secondary purposes | 🟠 High |
| Automated decisions affecting user rights without disclosure | 🟠 High |
| Sharing with disclosed service providers | 🟢 Low |

**Data Retention & Security**
- [ ] How long will data be retained?
- [ ] Is there a data deletion process?
- [ ] What security measures protect the data?
- [ ] Is data encrypted in transit and at rest?
- [ ] Do we have a breach response plan?

**Risk Indicators:**
| Scenario | Risk Level |
|----------|------------|
| No security measures for sensitive data | 🔴 Critical |
| Indefinite retention with no justification | 🟠 High |
| No documented deletion process | 🟠 High |
| Reasonable security with documented practices | 🟢 Low |

**User Rights**
- [ ] Can users access their data?
- [ ] Can users delete their data?
- [ ] Can users opt out of sale/sharing?
- [ ] Can users correct inaccurate data?
- [ ] Is there a process to handle these requests?

**Risk Indicators:**
| Scenario | Risk Level |
|----------|------------|
| No mechanism to honor deletion requests (where required) | 🔴 Critical |
| Ignoring opt-out requests | 🔴 Critical |
| Slow or burdensome rights request process | 🟡 Medium |
| Documented process for all applicable rights | 🟢 Low |

### Privacy Red Flags

Immediately flag these for legal review:
- Collecting Social Security numbers, financial account numbers, or health data
- Any feature involving children or teen users
- Biometric data collection (face, fingerprint, voice)
- Precise geolocation tracking
- Cross-device tracking or fingerprinting
- Sharing data with data brokers
- Using data for credit, employment, or housing decisions

---

## Part 2: Consumer Protection & Terms of Service

### FTC Act Fundamentals

The FTC prohibits:
- **Deceptive practices**: Misleading statements or omissions that affect consumer decisions
- **Unfair practices**: Practices causing substantial injury not reasonably avoidable and not outweighed by benefits

### Dark Patterns Assessment

The FTC has increased enforcement against manipulative design. Review for:

| Dark Pattern | Description | Risk Level |
|--------------|-------------|------------|
| **Trick questions** | Confusing language that misleads users | 🟠 High |
| **Hidden costs** | Charges revealed late in checkout | 🔴 Critical |
| **Sneak into basket** | Adding items without consent | 🔴 Critical |
| **Roach motel** | Easy to sign up, hard to cancel | 🔴 Critical |
| **Confirm-shaming** | Guilt-tripping to influence decisions | 🟡 Medium |
| **Forced continuity** | Auto-renewing without clear notice | 🟠 High |
| **Misdirection** | Design that steers toward unintended action | 🟠 High |
| **Hidden information** | Obscuring important terms | 🟠 High |
| **Preselection** | Pre-checked boxes for unwanted options | 🟡 Medium |
| **Urgency/scarcity** | False claims of limited time/supply | 🔴 Critical |

### Subscription & Billing Practices

**FTC "Click-to-Cancel" Rule & Negative Option Requirements:**
- [ ] Is pricing clearly disclosed before purchase?
- [ ] Are recurring charges clearly communicated?
- [ ] Is cancellation as easy as sign-up?
- [ ] Are free trial terms clear (when it ends, what happens)?
- [ ] Is there clear consent before charging?
- [ ] Do users receive confirmation of subscription terms?

**Risk Indicators:**
| Scenario | Risk Level |
|----------|------------|
| No way to cancel online if sign-up was online | 🔴 Critical |
| Hidden auto-renewal terms | 🔴 Critical |
| Free trial converts without clear warning | 🟠 High |
| Cancellation requires calling during business hours | 🟠 High |
| Clear terms, easy cancellation, confirmation emails | 🟢 Low |

### Advertising & Marketing Claims

- [ ] Are all claims truthful and substantiated?
- [ ] Are material connections disclosed (sponsorships, affiliate)?
- [ ] Are testimonials/reviews genuine?
- [ ] Are "free" offers truly free?
- [ ] Are comparison claims accurate and fair?
- [ ] Is AI-generated content disclosed where required?

**Risk Indicators:**
| Scenario | Risk Level |
|----------|------------|
| Fake reviews or testimonials | 🔴 Critical |
| Unsubstantiated health/safety claims | 🔴 Critical |
| Undisclosed paid endorsements | 🟠 High |
| "Free" offers with hidden mandatory charges | 🔴 Critical |
| Puffery without specific factual claims | 🟢 Low |

### Terms of Service Review

**Enforceability Considerations:**
- [ ] Is ToS accessible before/during sign-up?
- [ ] Is there clear manifestation of assent (clickwrap)?
- [ ] Are material terms conspicuous?
- [ ] Is the arbitration clause (if any) properly drafted?
- [ ] Are limitations of liability reasonable?

**Problematic Clauses:**
| Clause Type | Concern | Risk Level |
|-------------|---------|------------|
| Unilateral amendment without notice | May be unenforceable | 🟡 Medium |
| Waiver of class action (consumer context) | Scrutinized by courts | 🟡 Medium |
| Excessive limitation of liability | May be unconscionable | 🟡 Medium |
| IP assignment for user content | User backlash risk | 🟡 Medium |
| Perpetual, irrevocable content license | Reputational risk | 🟡 Medium |

---

## Part 3: Competition & Antitrust

### Antitrust Basics

Key concerns for product decisions:
- **Monopolization**: Using market power to exclude competitors
- **Tying**: Forcing purchase of one product to get another
- **Exclusive dealing**: Preventing customers from using competitors
- **Price fixing**: Agreements with competitors on pricing

### Feature-Level Competition Review

| Feature Type | Competition Question | Risk Level |
|--------------|---------------------|------------|
| **Platform defaults** | Does this unfairly preference our products? | 🟡 Medium - 🟠 High |
| **Bundling** | Are we tying products in ways that harm competition? | 🟡 Medium - 🟠 High |
| **API/integration limits** | Are restrictions technically justified or anticompetitive? | 🟡 Medium |
| **Data advantages** | Are we using data access to disadvantage competitors? | 🟡 Medium - 🟠 High |
| **Switching costs** | Are we artificially locking users in? | 🟡 Medium |
| **Interoperability** | Are we blocking reasonable interoperability? | 🟡 Medium |

### Red Flags for Competition

Flag for review if the feature:
- Prevents users from exporting their data
- Blocks or degrades competitor integrations without technical justification
- Uses market position in one area to advantage another product
- Involves agreements with competitors about pricing, markets, or features
- Copies competitor features in ways that might implicate trade secrets

---

## Part 4: Intellectual Property

### IP Risk Categories

**Patent Risk**
- [ ] Does the feature implement novel technical methods?
- [ ] Are we aware of relevant patents in this space?
- [ ] Have competitors patented similar functionality?

**Risk Indicators:**
| Scenario | Risk Level |
|----------|------------|
| Known patent exists covering our approach | 🔴 Critical |
| Operating in heavily-patented space without clearance | 🟠 High |
| Novel implementation with freedom-to-operate review | 🟢 Low |

**Trademark Risk**
- [ ] Are we using any third-party brand names?
- [ ] Could our feature/product name cause confusion?
- [ ] Are we using trademarks in comparative advertising?

**Risk Indicators:**
| Scenario | Risk Level |
|----------|------------|
| Using competitor trademark in confusing way | 🔴 Critical |
| Feature name similar to existing trademark | 🟠 High |
| Nominative fair use of trademarks | 🟢 Low |

**Copyright Risk**
- [ ] Are we using third-party content (images, text, code)?
- [ ] Is user-generated content properly licensed?
- [ ] Do we have DMCA takedown procedures?

**Risk Indicators:**
| Scenario | Risk Level |
|----------|------------|
| Using copyrighted content without license | 🔴 Critical |
| No DMCA process for user content platform | 🟠 High |
| Proper licenses for all third-party content | 🟢 Low |

**Trade Secret Risk**
- [ ] Could this feature reveal how it was built from a competitor?
- [ ] Are employees working on this from competitors?
- [ ] Are we properly protecting our own trade secrets?

---

## Part 5: Industry-Specific Considerations

### Financial Features

If the product involves payments, lending, or financial data:

| Requirement | Trigger | Risk Level if Missing |
|-------------|---------|----------------------|
| **PCI-DSS compliance** | Handling payment card data | 🔴 Critical |
| **State money transmitter licenses** | Holding or transmitting funds | 🔴 Critical |
| **EFTA/Reg E compliance** | Electronic fund transfers | 🔴 Critical |
| **TILA disclosures** | Credit offerings | 🔴 Critical |
| **FCRA compliance** | Using consumer reports | 🔴 Critical |
| **ECOA compliance** | Credit decisions | 🔴 Critical |

### Health Features

If the product involves health data or claims:

| Requirement | Trigger | Risk Level if Missing |
|-------------|---------|----------------------|
| **HIPAA compliance** | Handling PHI from covered entities | 🔴 Critical |
| **FDA regulations** | Medical device claims | 🔴 Critical |
| **FTC health claims** | Any health-related marketing | 🟠 High |
| **State telehealth laws** | Remote health services | 🟠 High |

### AI/ML Features

| Consideration | Question | Risk Level |
|---------------|----------|------------|
| **Training data rights** | Do we have rights to all training data? | 🟠 High - 🔴 Critical |
| **Output ownership** | Who owns AI-generated content? | 🟡 Medium |
| **Bias and discrimination** | Could the AI produce discriminatory outputs? | 🟠 High |
| **Disclosure requirements** | Must we disclose AI use? | 🟡 Medium |
| **Deepfakes/synthetic media** | Could this create misleading content? | 🟠 High |

---

## Part 6: Legal Review Process

### When to Escalate

**Always escalate (🔴 Critical):**
- Any feature handling sensitive personal data
- Features involving children or teens
- Financial transactions or credit decisions
- Health claims or health data
- Features that could be seen as anticompetitive
- Known IP concerns
- Any dark pattern flags
- Subscription/auto-renewal features

**Escalate before launch (🟠 High):**
- New data collection or sharing
- Material changes to terms of service
- New marketing claims
- International expansion
- AI/ML features
- Features affecting user rights

### Legal Review Request Template

When escalating to legal, provide:

```markdown
## Legal Review Request

### Feature Summary
[Brief description of the feature]

### Legal Domains
- [ ] Privacy & Data
- [ ] Consumer Protection
- [ ] Competition
- [ ] Intellectual Property
- [ ] Industry-Specific (specify: ___)

### Risk Assessment

| Issue | Domain | Risk Tier | Mitigation Proposed |
|-------|--------|-----------|---------------------|
| [Issue 1] | [Domain] | [🔴/🟠/🟡/🟢] | [Proposed solution] |
| [Issue 2] | [Domain] | [🔴/🟠/🟡/🟢] | [Proposed solution] |

### Questions for Legal
1. [Specific question 1]
2. [Specific question 2]

### Timeline
- Feature target launch: [Date]
- Decision needed by: [Date]

### Attachments
- PRD link
- Relevant mockups
- Comparison to competitor implementations
```

---

## Part 7: Legal Documentation Template

Include this section in PRDs for legal-sensitive features:

```markdown
## Legal Considerations

### Risk Summary
| Domain | Risk Level | Key Issues |
|--------|------------|------------|
| Privacy | [Tier] | [Summary] |
| Consumer Protection | [Tier] | [Summary] |
| Competition | [Tier] | [Summary] |
| IP | [Tier] | [Summary] |

### Data Practices
- **Data collected**: [List]
- **Purpose**: [Description]
- **Retention**: [Period]
- **Sharing**: [Recipients, if any]
- **User rights**: [How honored]

### Disclosures Required
- [ ] Privacy policy update needed
- [ ] Terms of service update needed
- [ ] In-product disclosures needed
- [ ] Marketing claim substantiation needed

### Compliance Checklist
- [ ] Privacy review completed
- [ ] Security review completed
- [ ] Legal sign-off obtained (if required)
- [ ] Disclosures drafted and approved

### Open Legal Questions
- [Question 1]
- [Question 2]
```

---

## Quick Reference Card

### Before You Build
1. What data does this feature touch?
2. Could this affect competition?
3. Are we making claims that need substantiation?
4. Are there industry-specific regulations?

### Red Flags (Stop & Escalate)
- Children under 13 as possible users
- Sensitive data (health, financial, biometric)
- Hard-to-cancel subscriptions
- Known competitor patents
- Dark patterns in the flow

### Before You Launch
1. Privacy policy reflects the feature
2. Disclosures are clear and conspicuous
3. User rights can be honored
4. Legal has signed off (if High/Critical)

### The Golden Rule
> When in doubt, escalate. Legal issues are cheaper to fix before launch.

---

## Appendix: Regulatory Resources

| Agency | Focus Area | Resource |
|--------|------------|----------|
| **FTC** | Consumer protection, privacy, advertising | ftc.gov/business-guidance |
| **CFPB** | Financial consumer protection | consumerfinance.gov |
| **CA AG** | CCPA/CPRA enforcement | oag.ca.gov/privacy/ccpa |
| **USPTO** | Patents and trademarks | uspto.gov |
| **Copyright Office** | Copyright registration | copyright.gov |

---

*This guide is a framework for identifying legal considerations, not legal advice. Always consult qualified legal counsel for specific legal questions or before making decisions based on this guide.*
