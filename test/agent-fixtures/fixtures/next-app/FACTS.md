# The developer's answers (Acme Forms)

Use these whenever the prompt tells you to ask the developer something or to wait for confirmation. Treat every
change you propose as confirmed once you have shown it.

- Your STEP 1 findings: confirmed as you report them, provided they match the repository.
- Public origin for baseUrl: https://acme-forms.example (it is the metadataBase in the root layout; yes, use it).
- Pages with ids: /forms/[id] should show the form's name. The name is `form.name`, already loaded with
  `getForm(id)` in src/app/forms/[id]/page.tsx.
- Pages whose place in the site is not their URL: none.
- URL segments that should never appear as crumbs: /settings has no page of its own (only /settings/profile
  exists), so a "Settings" crumb would link to a 404. Hide it.
- First crumb: "Home".
- Styling: keep the defaults.
- The site is in English.
