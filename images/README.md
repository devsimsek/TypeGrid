# Local Images Directory

TypeGrid natively supports hosting images locally.

To use local images:
1. Place your `.jpg`, `.png`, or `.webp` files in this directory.
2. In your `data/typegrid.json`, set the `url` property of your images to a relative path.

Example:
```json
{
  "id": "img-local-1",
  "filename": "my-photo.jpg",
  "url": "./images/my-photo.jpg",
  "width": 1920,
  "height": 1080,
  "size": 512000,
  "primary": true
}
```
