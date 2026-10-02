# QuizMeadow identity and integration

QuizMeadow adopts **Bruno project design system 3.0.1**, from [brand-tools-skills](https://github.com/bilgon32/brand-tools-skills). This is the product system, distinct from Bruno's personal website identity. The exact release, asset hashes, role bindings and review status live in `.bruno-design.json`.

## Interface

The dark identity header stays the same in both themes. Destinations live in the sidebar; the focused quiz replaces them with session context and Save & exit. Every route uses the same 1440px maximum frame, 32px horizontal/40px top inset, and 20px/24px narrow inset. Page headings use Barlow 40px/32px. Body/support/metadata use 16px/14px/12px, with 26px prompts and 18px answer text for sustained study reading.

The canonical, hash-checked bundle lives in `src/renderer/design-vendor`. Fonts, tokens and component CSS load in that order. All host adapters stay in `src/renderer/styles.css`; no managed file was edited. Opaque content objects share a 5px corner, essential boundary, top rim and 2px right/4px lower depth. Course and quiz cards share head/body/foot anatomy. Progress readouts are recessed and show real study values.

Blue identifies actions, selection and ordinary prerequisites. Green identifies success, red actual failure/danger, and amber partial credit or caution. Orange is a restrained logo/authorship detail. Native radio/checkbox answer choices retain keyboard semantics and a visible selected marker. Historical sessions are a collection of whole-item navigation buttons; no selectable-table role is used.

The shell and page frame stay still. Objects have one 450ms opacity arrival; changed question content and feedback have a 160ms local fade. Disclosures use the canonical reversible 200ms motion controller, with focus restored before closing focused content. Controllers finish on hide/reduced preference and are destroyed on unmount. A local Reduce motion preference supplements the OS preference and applies immediately. Progress values update directly without decorative sweeps or counters.

New installations follow macOS appearance. Existing preferences, YAML libraries, sessions, attempts, scoring and authoring contracts are preserved. Local motion preference is stored in the renderer's app-local storage; it does not change quiz or result files.

## Logo and fonts

The original **meadow fold** mark replaces the inherited optical ring. See [logo usage and rationale](LOGO.md) for its three silhouette directions, optical masters, theme/one-color treatments, clear space, review sheet and platform exports. No personal BG. signature or stock study mark is used.

Barlow and Barlow Condensed redistribute unmodified licensed font files with their SIL Open Font License notices. The project runtime notice generator reads the managed font licenses. The logo review exporter uses a licensed Barlow TTF for reproducible sheet labels. Geometry and app adaptations are original project work under the repository's MIT license.

## Adoption and review

The unpinned personal-style implementation was truthfully inventoried in [DESIGN-LEGACY.md](DESIGN-LEGACY.md). An untouched 2.1.0 comparison bundle was registered before reviewing the exact 2.1.0 → 3.0.1 migration plan. That registration did not assert legacy compliance. The plan and apply workflow updated only vendor assets; the host adaptation was reviewed separately.

[Design review](design-review-3.0.1.md) records actual checks and limitations. Future upgrades must use the canonical status/plan/apply/review workflow and the manifest's role mappings. Do not silently replace the pin when a skill or central design changes.
