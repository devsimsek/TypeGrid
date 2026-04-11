# API Reference (`typegrid.json`)

TypeGrid does not use a traditional backend database or REST API. Instead, your entire portfolio is driven by a single, static JSON file located at `data/typegrid.json`. 

This document outlines the expected schema and fields for that file.

---

## High-Level Structure

The root of the JSON file contains the following top-level objects:

```json
{
  "site": { ... },
  "projects": [ ... ],
  "collections": [ ... ],
  "pagination": { ... },
  "socials": { ... },
  "settings": { ... },
  "meta": { ... }
}
```

---

## 1. Site Object
Controls global metadata, SEO defaults, and author information.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | The global name of your portfolio. |
| `description` | `string` | Site-wide description (used in meta tags). |
| `base_url` | `string` | E.g., `https://example.com`. Used to generate absolute URLs for Open Graph images. |
| `lang` | `string` | Default `en-US`. |
| `favicon` | `string` | Path to the favicon. |
| `accent` | `string` | Hex code for the primary accent color (e.g., `#ea9a97`). |
| `open_graph` | `object` | Default fallback OG data (`title`, `description`, `image`). |
| `authors` | `array` | Array of author objects to display in the footer. |

### Author Object
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Author's name. |
| `url` | `string` | Link to author's website or about page. |
| `avatar` | `string` | URL to author's profile picture. |
| `socials` | `array` | Array of objects: `{ "platform": "twitter", "url": "..." }`. |

---

## 2. Projects Array
An array of projects. Each project generates a detail page and a card in the grid.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` / `slug` | `string` | Unique identifier (e.g., `urban-geometry`). |
| `title` | `string` | Display title. |
| `year` | `integer` | Year the project was shot. |
| `tags` | `array[string]` | Tags for categorization and filtering. |
| `description` | `string` | Long-form description shown on the project page. |
| `excerpt` | `string` | Short description used on grid cards and SEO tags. |
| `camera` | `string` | (Optional) Camera body used. |
| `lens` | `string` | (Optional) Lens used. |
| `images` | `array` | Array of image objects belonging to the project. |
| `seo` | `object` | SEO overrides (`meta_title`, `meta_description`, `canonical_url`). |

### Image Object (Local & Remote Support)
TypeGrid supports both remotely hosted images (e.g., Unsplash, AWS S3) and locally hosted images. 

To use local images, place them in the `/images/` directory at the root of your project and use a relative path.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique ID for the image. |
| `filename` | `string` | Display name shown in the lightbox metadata. |
| `url` | `string` | **Relative** (`./images/photo.jpg`) or **Absolute** (`https://...`). |
| `width` | `integer` | Image width in pixels (required for proper scaling). |
| `height` | `integer` | Image height in pixels (required for proper scaling). |
| `size` | `integer` | File size in bytes (shown in the lightbox). |
| `primary` | `boolean` | Exactly **one** image per project must be `true` (used as the thumbnail). |

---

## 3. Collections Array
Named groups of projects, allowing you to create curated lists (e.g., "Favorites" or "2024 Retrospective").

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `title` | `string` | Display title. |
| `description` | `string` | Short description of the collection. |
| `project_ids` | `array[string]` | Array of project `id`s that belong in this collection. |

---

## 4. Pagination Object
Controls how the main grid renders and chunks data.

| Field | Type | Description |
| :--- | :--- | :--- |
| `page_size` | `integer` | Number of projects to show per page (default: `12`). |
| `total_projects` | `integer` | Automatically calculated by the data loader. |
| `total_pages` | `integer` | Automatically calculated by the data loader. |

---

## 5. Socials & Settings

### Socials
Contains global share links and dynamic text templates.
- `links`: Site-wide social media URLs.
- `share_templates`: String templates for sharing projects. Tokens like `{title}` and `{url}` are dynamically replaced by Alpine.js.

### Settings
Contains UI preferences.
- `layout`: Column configurations for `desktop`, `tablet`, and `mobile`.
- `sort`: Defines default grid sorting (e.g., `{ "field": "year", "order": "desc" }`).