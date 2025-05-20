# UI Behaviour Patterns

This project hides destructive actions until the user interacts with an item. The pattern mirrors the message controls:

- **Desktop:** action icons stay hidden until the row is hovered.
- **Mobile:** the first tap reveals the icons; a second tap activates them.
- **Keyboard:** focusing the row or buttons also reveals the icons via `focus-within`.

The behaviour is implemented with Tailwind's `group-hover` utilities and a small
`onTouchStart` toggle for touch devices. Buttons remain real `<button>` elements
so keyboard users can tab to them and keep the action area visible.
