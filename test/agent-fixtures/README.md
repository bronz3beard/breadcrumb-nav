# Validating the AI setup prompt

The prompt in `docs/agent-setup.md` is tested against real projects, not just written. This directory holds what the
test needs so it can be repeated whenever a public option is added, removed or renamed (the releasing guide asks for
that). Nothing here ships in the npm package, which contains only `dist`.

## What is here

- `fixtures/next-app`: a Next.js 16 App Router app in TypeScript with Tailwind CSS 4 under `src/app`, an old client
  breadcrumb component with relative-URL JSON-LD, and a `/settings` segment with no page of its own.
- `fixtures/vite-app`: a Vite + React Router app in plain JavaScript with no Tailwind and an old `localStorage`
  history trail. `/returns` belongs under Account › Orders.
- `fixtures/*/FACTS.md`: the developer's answers to the prompt's questions, so a run needs no human at the keyboard.
- `reference-answers.md`: what a correct run produces for each fixture, written before any assistant ran.
- `grade-next.mjs`, `grade-vite.mjs`: nine objective checks each, run inside a finished fixture copy.
- `prepare-run.mjs`: makes a fresh run directory from a fixture, with the prompt extracted from the docs.
- `prompt-runs.md`: the record of every round so far, with what each failure taught the prompt.

## Running a round

1. Build the library and install each fixture once (the fixtures depend on this repository by path):

   ```sh
   npm run build
   (cd test/agent-fixtures/fixtures/next-app && npm install)
   (cd test/agent-fixtures/fixtures/vite-app && npm install)
   ```

2. Prepare a run directory per assistant and fixture (the target can be anywhere gitignored, `.loop-out` say):

   ```sh
   node test/agent-fixtures/prepare-run.mjs next-app .loop-out/prompt-runs/large-next
   node test/agent-fixtures/prepare-run.mjs vite-app .loop-out/prompt-runs/large-vite
   ```

3. Give a cold assistant (no memory of this project) the `brief/PROMPT.txt` file as the developer's message, tell it
   the repository is `repo/`, and tell it to take answers from `brief/FACTS.md` whenever the prompt asks the
   developer something. Let it work.

4. Grade the result inside the repository copy, then apply the five human checks on the agent-setup page to the
   assistant's transcript:

   ```sh
   (cd .loop-out/prompt-runs/large-next/repo && node ../../../../test/agent-fixtures/grade-next.mjs)
   (cd .loop-out/prompt-runs/large-vite/repo && node ../../../../test/agent-fixtures/grade-vite.mjs)
   ```

5. Record the round in `prompt-runs.md`. If a run fails because of something the prompt could have said, add the
   rule to the prompt and rerun the whole round from clean copies. A round passes when no prompt edit was needed
   between its runs. Update the "Last validated" line and the table on the agent-setup page.

Use at least two assistant sizes and both fixtures. The record so far shows the small model failing on rules it had
read, so its failures are informative but not blocking.
