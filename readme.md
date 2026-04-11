## TypeGrid

Author: devsimsek
Date: April 12, 2026

### Overview

TypeGrid is a static, minimal photographers' portfolio with a monospace, retro-UI aesthetic. The app reads a single JSON "API" (typegrid.json) and renders per-project pages with SEO/Open Graph and social share support. Client-side edits export a new JSON (and optional ZIP with images). Pagination is supported per-project (page files optional).

## Top-level JSON structure

- site: site-wide settings and OG defaults
- projects: array of project objects (each project contains its own SEO & OG)
- collections: named lists of project ids
- posts: (future) blog posts (same slug/SEO rules)
- pagination: pagination defaults & metadata
- socials: share links and templates
- settings: UI preferences
- meta: bookkeeping (id counters, version)

Example skeleton:
{
"site": { ... },
"projects": [ ... ],
"collections": [ ... ],
"posts": [ ... ],
"pagination": { ... },
"socials": { ... },
"settings": { ... },
"meta": { ... }
}

## Project object (complete spec)

- id: string (slug, /^[a-z0-9-]+$/)
- slug: string (same as id; used in URLs)
- title: string
- year: integer (1970..current+1)
- tags: [string]
- description: string (plain text)
- excerpt: string (optional, for OG/SEO)
- camera?: string|null
- lens?: string|null
- favorite: boolean
- images: [
  {
  id: string,
  filename: string,
  url: string, // relative or data URL; exported OG must be absolute
  width: integer,
  height: integer,
  size: integer, // bytes
  primary: boolean
  }
  ] (must contain exactly one primary true)
- seo: {
  meta_title?: string,
  meta_description?: string,
  canonical_url?: string,
  noindex?: boolean
  }
- open_graph: {
  title?: string,
  description?: string,
  image?: string // relative path or absolute URL
  }
- created_at: ISO8601
- updated_at: ISO8601
- draft?: boolean // if true, excluded from public lists
- url?: string // computed on export: site.base_url + "/projects/" + slug

## Site object (complete spec)

- title: string
- description?: string
- base_url?: string // e.g., "https://example.com" (used for absolute OG URLs)
- lang?: string (default "en-US")
- favicon?: string
- accent?: string // hex color
- version: string
- created_at: ISO8601
- open_graph?: { title?, description?, image? }
- authors?: [{ name, url, avatar, socials?: [{ platform, url }] }]

## Pagination object

- page_size: integer (default 12)
- total_projects: integer
- total_pages: integer
- pages?: [ // optional per-page files for large sites
  { page: 1, projects_file: "data/projects-page-1.json" }
  ]

Client behavior:

- Compute paging client-side when pages[] absent.
- Support URL pattern ?page=N or /page/N/.
- Infinite scroll option: fetch next page file when available.

## Collections

- id: string
- title: string
- project_ids: [string]
- created_at: ISO8601
- description?: string

## Posts (future)

- id, slug, title, excerpt, content (markdown), tags[], author, published_at, updated_at, featured_image, draft:boolean
- seo & open_graph same structure as project

## Socials

- links: [{ platform, url }]
- share_templates: {
  "project": "https://twitter.com/intent/tweet?text={title}&url={url}",
  "site": "https://twitter.com/intent/tweet?text={site_title}&url={url}"
  }

Placeholder tokens: {title},{url},{excerpt},{site_title},{slug}

## Footer

The footer displays site-wide information and author credits with optional social links:

- Site description (from site.description)
- Authors section (if site.authors[] present):
  - Author name with optional profile link (site.authors[].url)
  - Author avatar (site.authors[].avatar) if provided
  - Author social links (site.authors[].socials[]) if provided:
    - Each social link includes platform (e.g., "twitter", "instagram", "github") and url
    - Displayed as icon/text links for quick access to author profiles
- Site-wide social share links (from socials.links) for sharing the entire site

## Settings

- layout: { columns_desktop, columns_tablet, columns_mobile }
- sort: { field: "year"|"title"|"created_at", order: "asc"|"desc" }
- show_thumbnails: boolean
- ui: { monospace_font?: string, accent_color?: string }

## Meta

- next_project_id: integer
- version: string

## URL & Export rules

- Per-project page path: /projects/{slug}/ (export should generate HTML at that path)
- Canonical URL priority: project.seo.canonical_url -> project.url -> site.base_url + project path
- OG image: project.open_graph.image -> project.images[primary].url -> site.open_graph.image
- Absolute OG URLs required in exported HTML: if image path is relative, convert to site.base_url + path.

## Paging & Large dataset strategy

- Option A (single-file): include all projects and pagination metadata in typegrid.json.
- Option B (paged files): typegrid.json contains pages[] referencing project-page files; client fetches per-page JSON.
- Merge/import should update pagination.total_projects and total_pages.

## Import / Export & Merge rules

- Import:
  - If incoming id matches existing id:
    - If incoming.updated_at > existing.updated_at → replace existing.
    - Else → keep existing.
  - If id collision but content differs and updated_at equal → append suffix "-n" to slug to ensure uniqueness.
- Create:
  - Generate slug from title: trim, toLowerCase, replace non-alnum with "-", collapse dashes; ensure uniqueness by appending -n.
  - Set created_at = updated_at = now.
  - Increment meta.next_project_id if numeric scheme used.
- Delete:
  - Remove from projects and remove id references from collections.
- Primary image:
  - Ensure exactly one image has primary=true; if none, set first image.
- Export:
  - Output full typegrid.json with absolute OG URLs if site.base_url present.
  - Optional ZIP: include /projects/{slug}/index.html per project (prerendered with meta tags) + images + typegrid.json.

## SEO & Open Graph generation

Per-item meta generation order:

- title: project.seo.meta_title -> project.open_graph.title -> project.title -> site.title
- description: project.seo.meta_description -> project.open_graph.description -> project.excerpt -> site.description
- image: project.open_graph.image -> primary image url -> site.open_graph.image
- url: project.seo.canonical_url -> computed project.url (site.base_url + /projects/{slug}/)
  Tags to emit:
- <title>, meta description, link rel=canonical
- Open Graph: og:title, og:description, og:image, og:url, og:type (website/article)
- Twitter card: twitter:card=summary_large_image, twitter:title, twitter:description, twitter:image
- Structured data: minimal JSON-LD for WebPage and ImageObject (optional)

## Social share integration

- Use share_templates; generate share URLs by replacing placeholders.
- Ensure share URLs include absolute project URL.
- Provide small modal or new-window behavior when sharing.

## Validation rules

- id/slug pattern: /^[a-z0-9-]+$/
- title: non-empty
- images: array length >=1 and exactly one primary=true
- timestamps: valid ISO8601
- year: integer 1970..(current year + 1)
- base_url: valid absolute URL if present

## Client API surface (static, single-file model)

- GET /data/typegrid.json → full dataset (or meta + pages[])
- GET /data/projects-page-N.json → page payload (if split)
- IMPORT: file input (typegrid.json) → merge rules applied client-side
- EXPORT: trigger download of typegrid.json; optional ZIP builder for HTML + images
- ROUTES:
  - / -> grid (page query optional)
  - /projects/{slug}/ -> project detail (prerendered HTML recommended for SEO)
  - /posts/{slug}/ -> blog post (future)

## Sample metadata for a project page (HTML meta example)

- title: "Urban Stills — TypeGrid"
- meta description: "Series of quiet city frames."
- meta canonical: https://example.com/projects/urban-stills-01/
- og:title, og:description, og:image, og:url
- twitter: card tags included

## Accessibility & Performance notes

- Ensure per-project pages include performant image srcset and width/height attributes.
- Use rel="preload" for primary image on project page.
- Include aria labels on navigation and share controls.
- Keep JSON payloads compressed for large sets; consider per-page files to reduce initial load.

## Migration & Backwards Compatibility

- Version top-level meta.version. Tools should accept older versions and map fields (e.g., migrate images[].primary boolean).
- When adding new fields, prefer optional keys and default client-side.

## Export / Build recommendations for best SEO

- Static-export per-project HTML with full meta tags and OG absolute URLs.
- Include RSS/Atom for posts (future).
- Provide robots.txt instructions and sitemap.xml generation from projects[].
