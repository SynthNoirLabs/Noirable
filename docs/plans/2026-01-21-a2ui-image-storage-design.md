# A2UI Image Persistence Design

**Goal:** Store generated images on disk and reference them by short URLs so chat context and JSON evidence stay small.

**Overview**
Generated images currently return `data:image/...;base64,...` strings, which inflate evidence payloads and chat context. The fix is to persist images to a local directory and replace `image.src` with a short `/api/images/<id>.<ext>` URL.

**Data Flow**
1. Model outputs `image.prompt` (or `image.src` as a data URL).
2. `resolveA2UIImagePrompts` generates an image (if needed).
3. The image bytes are written to `.data/images/` with a random id and extension.
4. The tool returns `image.src` as `/api/images/<id>.<ext>`.
5. The UI renders via the API route and keeps evidence payloads small.

**Storage**
- Default directory: `.data/images/` (gitignored).
- Optional override: `A2UI_IMAGE_DIR`.
- Filename: `<uuid>.<ext>` where ext is derived from the image media type.

**API Route**
`GET /api/images/[id]` serves the stored file with the correct `Content-Type` and long cache headers. The handler validates the filename to prevent path traversal and returns 404 for unknown ids.

**Error Handling**
If image generation or persistence fails, the tool returns a small SVG placeholder. The pipeline never returns base64 data in `image.src`.

**Tests**
- Unit test: `resolveA2UIImagePrompts` replaces a data URL with `/api/images/...`.
- API route test: valid id returns 200 and bytes; invalid id returns 404.

**Ops**
`.data/images` can be cleaned manually during development. No cleanup job is required for now.
