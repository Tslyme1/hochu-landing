# Story polish 3.1

- Center each mobile copy block in the available space between the stories rail and the fixed top of the device. Single-line and multiline headings have equal top/bottom breathing room. The device does not jump between chapters.
- Only the active story occupies the remaining rail width. Seven inactive stories are circular dots. Preserve tap and keyboard navigation; animate the active width without changing the content transition controller.
- Increase the story interval to 10,000 milliseconds. Preserve looping from the last chapter to the first and existing timer suspension while the gallery is open, scrolling, holding a pointer, or using reduced motion.
- Restore full opacity to the secondary part of the hero heading. Change its literal HTML text to lowercase: «жизнь вашего».
- Use the final chapter's computed description font size and line-height as the reference for all other descriptions at every breakpoint. Do not rewrite their text.
- Match gallery mockup width and height to the main-page mockup's untransformed dimensions, including on resize. A tall mockup scrolls inside the gallery instead of being shrunk or cropped.
- Version the stylesheet and script references in index.html as 3.1.0. No media, source images, loader, or account links changed.

## Validation

411 automated assertions passed in Chromium at 12 viewport sizes (320×568 through 1920×1080, including landscape). Checks cover all eight chapters, equal description metrics, circle/active-bar geometry, copy centering, matching gallery dimensions, navigation, real-time 10-second wrap, and absence of uncaught JavaScript errors.

The browser tests used the complete document with the same media embedded for local testing. The three uploaded file blob hashes were verified against the tested files. Physical iPhone/Android devices and Safari were not tested. These results do not verify native Safari toolbar transparency.
