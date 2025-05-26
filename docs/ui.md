# UI Conventions

Components live under `src/` and follow the [shadcn/ui](https://ui.shadcn.com/) approach. Each component gets its own folder with an `index.ts` barrel export. Hooks are prefixed with `use`.

### Hide/Delete UX
Destructive actions stay hidden until the session row is hovered or focused. Mobile devices reveal actions on first tap and trigger them on second tap. We use Tailwind `group-hover` utilities and a small `onTouchStart` helper. Buttons remain accessible with real `<button>` elements.
