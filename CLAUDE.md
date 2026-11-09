# Notes for Claude

## Design assets (Figma)

When the site needs an illustration or other visual asset, look in these Figma files first,
through the Figma connector. Prefer the vector (SVG) versions, recolour them to the brand
palette, keep them small, and share a preview before anything ships.

| File                                                                                                                     | What is in it                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [1,600 Free Illustrations by Streamline](https://www.figma.com/design/ZLKdbP0gK6QuEMzuBemjuP)                            | Minimal black-and-white line illustrations in 24 topic pages (Development, Technology, Design, Work, Business and more). The topic pages hold PNG previews; the vectors are on the "All Vector Illustrations" page. |
| [SVG Abstract Patterns & Illustrations Library by Pavan Kondapuram](https://www.figma.com/design/fX5ReKIfHCQ7zmdlj6haEl) | Eleven vector backgrounds: geometric patterns, gradient blobs, topographic contour lines, dot fields and concentric rings, in bright colours. Use pieces recoloured to the brand palette, not whole backgrounds.    |
| [1000 textures](https://www.figma.com/community/file/1370508545199042511)                                                | Not reviewed yet: this is a Community page link, which the connector cannot open. Open the file in Figma (it copies to drafts) and replace this link with that `/design/` link.                                     |
| [Background Grid patterns for website design](https://www.figma.com/design/SDj8IYpjsXNIoRJ02bBXWi)                       | Not reviewed yet: the Figma connector hit the plan's call limit before it could be opened.                                                                                                                          |
| [Crazy Beautiful Complex Gradients](https://www.figma.com/design/WtCxCqKylFSIOhBL98fWWg)                                 | Not reviewed yet: the Figma connector hit the plan's call limit before it could be opened.                                                                                                                          |

- Add every new source to the asset credits comment at the top of `app/page.tsx`.
- Community page links (`figma.com/community/file/...`) cannot be read through the
  connector; ask for the `/design/` link of a copy instead.
- Downloading assets from Figma needs `www.figma.com` reachable from the session's network.
- The Figma account is on the Starter plan, whose connector allows few calls; spend them on
  screenshots and exports that matter, and say so when the limit is reached.
