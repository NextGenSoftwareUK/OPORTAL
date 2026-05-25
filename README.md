# OPORTAL

This repository is being used as a static site deployment.

## Active files

Only the root-level files and folders are currently in use for the live site:

- `index.html`
- `assets/`
- `favicon.svg`
- `web.config`
- `postman/`

## Legacy source tree

The `source/` directory is legacy framework/build output from a previous setup.
It is not part of the current deployment workflow and should be treated as
obsolete unless we intentionally decide to rebuild the site from it later.

If you plan to remove `source/`, it is worth confirming that no deployment,
CI, or documentation still references it first.

## Working rule

For day-to-day changes, edit only the root-level live files and folders.
That means `index.html`, `assets/`, `favicon.svg`, `web.config`, and `postman/`.

If we decide to bring SCSS/build tooling back later, we can re-sync the live
root files into `source/` and revive the framework workflow then. Until that
happens, treat `source/` as read-only reference material.
