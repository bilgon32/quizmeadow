# QuizMeadow visual identity

QuizMeadow follows Bruno Gonçalves's design system **version 1.3, 30 September 2026**, from the `brunogoncalvesdev` source checkout. Its implementation guide, voice guide, tokens, optical base, and distributable fonts were read together. That identity is still a review branch; this app applies its selected foundation with its own QuizMeadow name and study glyph.

## Sources and mapping

- `src/renderer/brand/tokens.css` and `optical-base.svg` are unchanged copies of the canonical sources.
- `quizmeadow.svg` embeds the exact optical base and adds an original open-book/check foreground. The circle, gradients, masks, texture, and viewBox remain intact.
- `quizmeadow-mono.svg` provides a simplified small-size fallback. Both versions preserve generous clear space.
- Local Latin subsets of Barlow 400/600 and Barlow Condensed 600 include their OFL notices in the bundled dependency notices.

Existing app theme variables map onto brand canvas, recess, surface, reading, accent, boundary, and functional-state roles. Major headings use the condensed face; study content uses Barlow. Body text is 18 px, secondary text 16 px, labels 14 px, and question prompts 26 px. Controls use the 2 px radius, visible edges, and a separate 3 px focus outline. Main actions have 48 px minimum targets. Spacing and rules replace most decorative card framing.

## Product adaptations

Navigation, course units, question formats, scoring, and the local data model are retained. New installations default to dark. Saved theme preferences are preserved, including matching macOS. The warm light theme has separately reviewed dark text and functional colors. Optical art stays on its dark canvas; only the small monochrome mark switches to dark ink on light surfaces.

A study-specific foreground replaces Bruno's personal six-strand glyph. BG. is not used as the product name. The macOS icon adds a flat dark rounded platform canvas, with no second gradient, rotation, or shadow. Colored exports serve 64 px and above; monochrome exports serve 32 px and below. `npm run icon` regenerates the ICNS and PNG sizes from committed SVGs using the pinned export tool.

Motion remains brief page entrances, progress transitions, and 180 ms hover feedback, with macOS Reduce Motion support. Optional Light Drift is omitted to keep the study workspace quiet.

## Review

README screenshots come from the rendered app and everyday tour, using isolated data. `npm run test:visual` checks both themes, layouts at 1380/960/320 px, all ten formats, representative text contrast, 48 px action targets, modal keyboard focus, the skip link, and reduced motion. The supported minimum window remains 960 px; 320 px is a responsive stress test.

The study mark is reviewed at 128/64/32 px, including its one-color silhouette. Optical colors stay in artwork. Status text, answer markers, navigation edges, and question labels accompany state colors.
