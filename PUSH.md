# Getting this on GitHub

The Claude session that built this cannot reach `github.com`, so the push has to
come from a machine that is logged in. Two commands.

## If the repo already exists

```bash
cd <where you unpacked prohance-pem-ui>
git remote add origin https://github.com/vineshprohance/prohance-pem-prototype
git push -u origin main
```

The tarball already contains a git repository with history and the commit
message, so there is nothing to initialise.

## If you want a fresh repo instead

```bash
gh repo create prohance-pem-prototype --private --source=. --remote=origin --push
```

Swap `--private` for `--public` if the URL has to open for anyone without an
invite. See the note on visibility below before you do.

## Then turn the URL on

Repository, Settings, Pages, Source: **GitHub Actions**.

`.github/workflows/pages.yml` does the rest on every push to `main`: it runs the
engine and chart guards, builds `dist-standalone/ProHance-PEM.html`, and serves
it as the site's `index.html`. A single self-contained file, so there is no
asset path to get wrong.

The URL is then:

```
https://vineshprohance.github.io/prohance-pem-prototype/
```

It takes a minute or two the first time. The Actions tab shows the run.

## Visibility, before you pick

GitHub Pages on a **private** repository needs a paid plan. On a free plan the
repository has to be **public** for that URL to open for Richard or anyone else.

Public means the whole repository is public: the prototype, the data model, the
naming decisions, `CLAUDE.md`, and the audit docs under `docs/` that quote
internal ProHance sources. The vendors and their numbers are invented. The
framework around them is not.

Three ways to give Richard a link without that:

1. **Keep the repo private and add him as a collaborator.** He sees the code and
   can run it, but there is no browsable URL without Pages.
2. **Publish only the built page.** Put `dist-standalone/ProHance-PEM.html` in a
   separate public repo on its own, with no `docs/` and no `CLAUDE.md`. The
   prototype opens at a URL; nothing else is exposed.
3. **Send the Claude artifact link.** It is already live and already shared with
   the people you chose, and it updates in place when this is rebuilt.
