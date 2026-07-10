# Dev Portal — Pending Suggestions

## Content to consider removing

- **Quick Links: USPs** (`OASIS_UNIQUE_SELLING_PROPOSITIONS.md`) — marketing doc, not a developer resource
- **Quick Links: Use Cases** (`OASIS_TECHNOLOGY_SUMMARY_AND_USE_CASES.md`) — same; more useful on the main site
- **Documentation: Investor Evaluation Guide** (`INVESTOR_EVALUATION_GUIDE.md`) — wrong audience for a dev portal

## Whitepapers to trim

Currently 10 whitepapers listed. Consider keeping only the most dev-relevant 4:
- OASIS Whitepaper ✓ keep
- OASIS Lite Paper ✓ keep
- HoloNET Whitepaper ✓ keep
- HyperDrive Whitepaper ✓ keep

Consider removing:
- Our World Whitepaper
- One World Whitepaper
- NFT System Whitepaper
- Universal Wallet Whitepaper
- Cosmic ORM Whitepaper
- Holonic Braid Whitepaper

## UI Component Library documentation

Devs expect full API reference docs — their absence is a real adoption barrier. Recommended:
- Props table per component (name, type, default, description)
- Copy-paste code examples for common use cases
- Exported TypeScript types / interfaces
- Accessibility notes (ARIA roles, keyboard nav)

Suggested approach: generate docs from JSDoc/TSDoc comments into a static site (Storybook or VitePress) rather than writing by hand — 6 frameworks × 117 components makes manual docs impractical. Could be added as a planned item in the dev portal Tutorials section.
