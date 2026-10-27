# Decktron
Electron-based X browser with panes and multi-account support.
Work in progress.

### Usage

- Add a pane with the "Add Pane" button in the top bar or the "+" column at the end of the panes.
- Add an account with the button next to the account icons. Click an account icon to add a pane for the account or to remove the account.
- Open the pane menu with the icon or the menu button in the pane header.
- Drag a pane header to reorder panes, and drag the gap at the right edge of a pane to resize it. Double-click the gap to reset the width.
- Click the title in a pane header to scroll the page to the top.
- The layout and the window bounds are saved in `layout.json` in the user data directory.

### Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl+T | Add a pane |
| Ctrl+W | Close the focused pane |
| Ctrl+Shift+T | Reopen the closed pane |
| Ctrl+Shift+Left / Right | Move the focused pane |
| Alt+Left / Right | Go back / forward in the focused pane |
| F5, Ctrl+R | Reload the focused pane |
| Ctrl+Plus / Minus / 0 | Zoom in / out / reset the focused pane |

### Run

```shell
npm install
npm run dev
```

### Build
```shell
npm run package
```

An unpacked application will appear in the `dist/win-unpacked` folder (or the equivalent folder for the current platform). Use `npm run make` to create installers.

### Check
```shell
npm run typecheck
npm run lint
```
