# Web Design Mastery & Professional Standards

These are the primary guidelines for all web design and frontend development tasks within this workspace, based on the "Web Design Mastery" principles and the user's requirement for highly professional aesthetics.

## Design Aesthetics & Principles
1. **Fitts' Law**: Place important buttons and navigation elements in easy-to-reach spots. Clickable elements must be large enough to be easily tapped or clicked.
2. **Zeigarnik Effect**: Use progress bars or incomplete indicators to encourage users to finish tasks.
3. **Clean & Minimalist Design**: Ensure complex functionality feels simple by maintaining clean UI elements and beautiful graphics/animations.

## Color System (60-30-10 Rule)
- **60% Dominant Color**: The main tone, covering the majority of the design (usually background colors like white, gray, black, or beige).
- **30% Secondary Color**: Complements the dominant color, used for typography, icons, and secondary visuals.
- **10% Accent Color**: Colors that really pop (brand colors). Apply sparingly to highlight important elements like call-to-action (CTA) buttons, key icons, or urgent notifications.
- **Contrast**: Ensure hierarchy. Don't let everything stand out equally (e.g., avoid making all text bright white on a dark background; use grays for secondary text).

## Typography System
- **Line-Height**: 
  - Body text (16-18px): 1.4x to 1.6x the font size.
  - Headings (32px+): 1.1x to 1.2x the font size.
- **Hierarchy & Naming**: Structure text using clear hierarchy (Display, Heading, Body, Label) and use semantic HTML tags (`h1`, `h2`, `p`, `small`).
- **Modern Typefaces**: Prefer modern typefaces like Inter, Roboto, or Outfit unless otherwise specified.

## Layout & Grids
- **Grids**: Rely on established grid systems (e.g., 12-column layouts) for alignment and structure.
- **Spacing**: Maintain consistent margins and gutters. Allow content to breathe with adequate whitespace.
- **Desktop vs. Mobile**: Use fixed grids or max-widths (e.g., 1200px or 1440px) on desktop to keep content compact and readable.

## High-Converting Landing Page Structure
When building landing pages, ensure the following structure:
1. **Above the Fold**: A clear offer that grabs attention immediately.
2. **Problem & Interest**: Magnify the user's problem to build interest.
3. **Value Proposition**: Present solutions using feature-benefit pairs.
4. **Social Proof**: Establish trust and credibility.
5. **Pricing / Call to Action**:
   - Provide a free or risk-free option.
   - Make pricing tiers visually distinct.
   - Summarize key features with icons for easy scanning.
   - Add urgency or limited availability where appropriate.

## Usage of MCPs (Shadcn UI)
- To achieve a premium, professional look, actively utilize the available `shadcn-ui-mcp-server` to fetch and integrate high-quality, pre-built components and blocks.
- **Workflow**:
  - Always check available components using `list_components` and `list_blocks`.
  - Fetch component metadata and implementation details via `get_component` and `get_block`.
  - Apply themes and consistent styles using `apply_theme` and `get_theme`.
- Leverage these tools to ensure all UI elements follow best practices for accessibility, responsiveness, and modern aesthetics.
