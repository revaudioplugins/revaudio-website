# Cart redesign implementation plan

**Goal:** Deliver the approved first step: a clearer RevAudio cart drawer in the local preview.
**Architecture:** Keep the existing native dialog and checkout provider flow. Resolve product display metadata and optimized images from the catalog at build time; persist only product slugs. Update layout and accessible feedback in Cart.astro.
**Tech stack:** Astro, vanilla JavaScript, existing house CSS tokens.

- [x] Replace the large image button with a full-width brass “Continue to payment” control; group product, subtotal, tax note and consent together. Provide a useful empty state.
- [x] Resolve current name, price, image and formats by slug, including legacy cart entries. Show USD explicitly and one licence per item.
- [x] Preserve legal-reader and checkout contracts; show an actionable message when the payment SDK cannot open. Restore focus after removing an item.
- [x] Build and inspect desktop/mobile, multiple products, removal, empty state, legal links, consent validation and keyboard closing. Do not submit a real purchase.
- [x] Record outcome and limitations. Leave local changes for design review; no push or deployment.

Dedicated inline payment page remains the next phase after review of this concrete cart design.
