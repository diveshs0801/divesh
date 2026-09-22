# Git & Version Control — Complete Interview Guide (1 Year Experience)

---

## Table of Contents
1. [Git Architecture & Internal Mechanics](#1-git-architecture--internal-mechanics)
2. [Everyday Commands & Workflows](#2-everyday-commands--workflows)
3. [Branching, Merging & Rebasing](#3-branching-merging--rebasing)
4. [Undoing Changes (Reset, Revert, Restore, Checkout)](#4-undoing-changes-reset-revert-restore-checkout)
5. [Git Stash, Reflog & Cherry-Pick](#5-git-stash-reflog--cherry-pick)
6. [Git Hooks & Husky Automation](#6-git-hooks--husky-automation)
7. [Branching Strategies (GitFlow vs GitHub Flow vs Trunk-Based)](#7-branching-strategies)
8. [Real-World Interview Scenarios & Troubleshooting](#8-real-world-interview-scenarios--troubleshooting)
9. [Quick Revision & Command Cheat Sheet](#9-quick-revision--command-cheat-sheet)

---

## 1. Git Architecture & Internal Mechanics

### Q1: What is Git and how does it differ from centralized VCS (like SVN)?

**Answer:**
Git is a **Distributed Version Control System (DVCS)** created by Linus Torvalds in 2005.

| Feature | Centralized VCS (SVN) | Distributed VCS (Git) |
|---|---|---|
| **Repository Storage** | Single central server holds full history | Every developer has a full clone with complete history locally |
| **Offline Work** | Cannot commit, view history, or branch offline | Full functionality offline (commit, log, branch, diff) |
| **Speed** | Network round-trip required for most operations | Nearly instant operations because they are local |
| **Single Point of Failure** | If the central server crashes/corrupts, history is lost | Any clone can restore the entire repository |

---

### Q2: What are the 4 main areas/stages of Git?

**Answer:**
```
 Working Directory ───(git add)───> Staging Area (Index) ───(git commit)───> Local Repo (.git) ───(git push)───> Remote Repo (GitHub/GitLab)
        │                                  │                                   │                                    │
        │<─────────(git checkout/restore)──┤                                   │                                    │
        │<─────────────────────────────────┴────────────(git reset --hard)─────┤                                    │
        │<─────────────────────────────────────────────────────────────────────┴─────────────(git pull)─────────────┤
```

1. **Working Directory**: The actual files on your filesystem that you edit.
2. **Staging Area (Index)**: A staging buffer file (`.git/index`) where changes are collected and organized before creating a commit.
3. **Local Repository (`.git` directory)**: Contains all committed history, blobs, trees, commit objects, and references (`refs/heads/*`).
4. **Remote Repository**: Hosted version (GitHub, GitLab, Bitbucket) used for team collaboration and backup.

---

### Q3: What are the 4 fundamental object types stored in `.git/objects`?

**Answer:**
Git is a content-addressable key-value store. Every object is identified by a 40-character SHA-1 (or SHA-256) hash:

1. **Blob (Binary Large Object)**: Stores pure file contents (no filenames, no timestamps, no permissions).
2. **Tree**: Represents a directory. Stores file names, permissions (`100644` for normal file, `100755` for executable), and SHA-1 pointers to blobs or nested sub-trees.
3. **Commit**: Contains a pointer to the root Tree object, parent commit SHA-1(s), author info, committer info, timestamp, and the commit message.
4. **Annotated Tag**: Points to a commit with a tagger name, date, and message.

```
Commit Object
├── Tree: 9a8b7c... (root directory)
│     ├── Blob: 3f2a1b... (package.json)
│     └── Tree: 8c7d6e... (src/)
│           └── Blob: 1b2c3d... (index.ts)
├── Parent: 4d5e6f... (previous commit)
├── Author: Divesh <divesh@example.com>
└── Message: "feat: add driver location tracking"
```

---

### Q4: What is `HEAD` in Git? What is a "Detached HEAD"?

**Answer:**
- **`HEAD`**: A reference pointer to the currently checked-out commit or branch. Usually stored in `.git/HEAD` as:
  ```
  ref: refs/heads/main
  ```
- **Detached HEAD**: Occurs when `HEAD` points directly to a specific commit hash rather than a named branch (e.g., after `git checkout <commit-sha>`).
  - **Risk**: Any commits created in a detached HEAD state are not tracked by any branch and will eventually be permanently deleted by the Git garbage collector (`git gc`).
  - **Fix**: Create a branch from your current position before switching away:
    ```bash
    git switch -c my-new-branch
    # OR
    git branch recovered-work
    ```

---

## 2. Everyday Commands & Workflows

### Q5: What is the difference between `git add .`, `git add -A`, and `git add -u`?

**Answer:**
- `git add .`: Stages new and modified files in the *current directory and its subdirectories* (in Git 2.x, it also stages deleted files in the current directory tree).
- `git add -A` (or `git add --all`): Stages **all** changes (new, modified, deleted) across the **entire repository**, regardless of your current working directory.
- `git add -u` (or `git add --update`): Stages only **modified and deleted** tracked files. It **ignores newly created untracked files**.

---

### Q6: What is `git diff` vs `git diff --staged`?

**Answer:**
- `git diff`: Compares **Working Directory** vs **Staging Area (Index)**. Shows what changes you have made that are NOT yet staged.
- `git diff --staged` (or `git diff --cached`): Compares **Staging Area** vs **Last Commit (`HEAD`)**. Shows what changes will go into the next commit if you run `git commit`.
- `git diff HEAD`: Compares **Working Directory** directly against **`HEAD`** (all uncommitted changes, staged or unstaged).
- `git diff branch1..branch2`: Shows the difference between the tips of two branches.

---

### Q7: What is the difference between `git fetch` and `git pull`?

**Answer:**
```
git pull = git fetch + git merge (or git rebase)
```

1. **`git fetch origin`**:
   - Downloads all new commits, branches, and tags from the remote repository to your local `.git` directory.
   - Updates remote tracking branches (e.g., `origin/main`).
   - **Does NOT touch your working directory or current branch.**
   - Completely safe to run anytime.

2. **`git pull origin main`**:
   - Runs `git fetch origin` first.
   - Immediately runs `git merge origin/main` into your current branch.
   - Can cause unexpected merge commits or merge conflicts in your working tree.

**Best Practice**:
Use `git pull --rebase origin main` to keep a clean, linear commit history without unnecessary "Merge branch 'main' of github.com" commits.

---

## 3. Branching, Merging & Rebasing

### Q8: What is a Fast-Forward Merge vs 3-Way Merge?

**Answer:**

#### Fast-Forward Merge (`--ff`):
Occurs when the target branch has NO new commits since the feature branch diverged. Git simply moves the target branch pointer forward to the feature branch tip. No new merge commit is created.

```
Before:
main:    A ─── B
                \
feature:         C ─── D

After git merge feature:
main, feature: A ─── B ─── C ─── D (HEAD)
```

#### 3-Way Merge (`--no-ff`):
Occurs when both `main` and `feature` have progressed with independent commits. Git finds the common ancestor (Base), compares the two tips, and creates a **new synthetic commit with two parents** (Merge Commit).

```
Before:
main:    A ─── B ─── E
                \
feature:         C ─── D

After git merge feature:
main:    A ─── B ─── E ─────── M (Merge Commit)
                \             /
feature:         C ─── D ────┘
```

Force a merge commit even if fast-forward is possible:
```bash
git merge --no-ff feature/wallet-service
```

---

### Q9: `git merge` vs `git rebase` — When to use which?

**Answer:**

| Feature | `git merge` | `git rebase` |
|---|---|---|
| **History** | Preserves exact chronological history and branch topology | Rewrites history into a clean, linear sequence |
| **Commit Hashes** | Original commits keep their hashes; creates 1 merge commit | Recreates commits with **new SHA hashes** |
| **Traceability** | Easy to see when a branch was merged | Harder to know the exact branch lifespan |
| **Conflict Resolution** | Resolves all conflicts at once in the merge commit | Resolves conflicts commit-by-commit sequentially |

#### Visual Rebase:
```
Before rebase:
main:    A ─── B ─── C
                \
feature:         D ─── E

Run on feature: git rebase main

After rebase:
main:    A ─── B ─── C
                      \
feature:               D' ─── E'  (new commit hashes!)
```

#### The Golden Rule of Rebase:
> **NEVER rebase a branch that is shared publicly with other developers (like `main` or `develop`).**
> Rebasing rewrites commit SHA hashes. If others base work on the old commits, their repos will diverge into merge hell.
> Rebase ONLY your private local feature branch against `origin/main` before opening a Pull Request!

---

### Q10: How does Interactive Rebase (`git rebase -i`) work?

**Answer:**
Interactive rebase allows you to reorganize, squash, edit, or delete commits before merging your PR.

```bash
git rebase -i HEAD~4
```

An editor opens with commands:
```
pick 7a1f2c3 feat: initial ride booking controller
squash 3b4c5d6 fix: typo in variable name
squash 9f8e7d6 fix: remove console.log
reword 1a2b3c4 feat: implement ride booking endpoint with validation
```

**Common commands:**
- `pick` (p): Keep commit as is.
- `reword` (r): Keep commit but edit commit message.
- `squash` (s): Melt commit into the previous commit and combine messages.
- `fixup` (f): Melt commit into previous commit and discard this commit's message.
- `drop` (d): Delete this commit entirely.
- `edit` (e): Pause rebase at this commit to amend files or split.

---

### Q11: How do you resolve a Merge Conflict step-by-step?

**Answer:**
When Git cannot automatically resolve divergent edits to the same lines of a file:

1. Git stops and marks conflicting files:
   ```bash
   git status
   # Shows "both modified: src/rides/rides.service.ts"
   ```
2. Open the file. Look for conflict markers:
   ```typescript
   <<<<<<< HEAD (current branch)
   const fareMultiplier = 1.5;
   =======
   const fareMultiplier = calculateSurgeMultiplier(demand, supply);
   >>>>>>> feature/surge-pricing (incoming branch)
   ```
3. Manually choose the correct code, remove `<<<<<<<`, `=======`, and `>>>>>>>`.
4. Stage the resolved file:
   ```bash
   git add src/rides/rides.service.ts
   ```
5. Complete the operation:
   - For merge: `git commit -m "merge: resolve surge pricing conflict"`
   - For rebase: `git rebase --continue`
6. If things go wrong, abort safely:
   - Merge abort: `git merge --abort`
   - Rebase abort: `git rebase --abort`

---

## 4. Undoing Changes (Reset, Revert, Restore, Checkout)

### Q12: Explain `git reset --soft`, `--mixed`, and `--hard`.

**Answer:**
This is one of the **#1 most asked Git interview questions**.

Suppose our commit history is: `Commit A -> Commit B -> Commit C (HEAD)`

```bash
git reset <type> HEAD~1   # Moving back to Commit B
```

| Flag | Working Directory | Staging Area (Index) | Commit History | Use Case |
|---|---|---|---|---|
| `--soft` | **Untouched** | **Untouched** (Changes from Commit C remain staged) | `HEAD` moves back to B | You committed too early; want to re-commit with more files or better message. |
| `--mixed` (default) | **Untouched** (Changes from C are in working dir) | **Unstaged** | `HEAD` moves back to B | You want to un-stage and re-select what to commit. |
| `--hard` | **WIPED OUT** (Reverts files to state of B) | **WIPED OUT** | `HEAD` moves back to B | You want to completely discard your last commit and all changes permanently. |

---

### Q13: `git reset` vs `git revert` — What is the key distinction?

**Answer:**
- **`git reset`**: Rewrites history by moving the branch pointer backward.
  - **Destructive** for remote branches. Requires `git push --force` if already pushed.
  - Recommended ONLY for local, unpushed commits.
- **`git revert <commit-sha>`**: Non-destructive undo.
  - Creates a **brand new commit** that applies the exact inverse diff of the target commit.
  - Leaves existing history intact.
  - Safe to use on public/shared branches (`main`, `staging`).

```bash
# Safely undo commit 3a4b5c on production branch:
git revert 3a4b5c
git push origin main
```

---

### Q14: What is `git restore` (Git 2.23+)?

**Answer:**
In older Git, `git checkout` was overloaded: it was used for switching branches, discarding local changes, and restoring files. Git 2.23 split this into `git switch` and `git restore`.

```bash
# Discard changes in working directory (untracked changes unaffected):
git restore src/app.service.ts

# Unstage a file (remove from staging area without losing working tree changes):
git restore --staged src/app.service.ts

# Restore a file from a specific commit:
git restore --source=HEAD~2 src/app.service.ts
```

---

## 5. Git Stash, Reflog & Cherry-Pick

### Q15: What is `git stash` and what are its common operations?

**Answer:**
`git stash` temporarily shelves (shelves/saves) dirty working directory and staged changes so you can work on something else (e.g., hotfix on another branch) without making an incomplete commit.

```bash
# Stash tracked changes with a descriptive message
git stash push -m "WIP: driver payout calculation"

# Stash including untracked files
git stash -u

# List all stashes in your stash stack
git stash list
# stash@{0}: On main: WIP: driver payout calculation
# stash@{1}: On feature: temporary fix

# Apply latest stash and remove from stash list:
git stash pop

# Apply latest stash BUT keep it in stash list:
git stash apply

# Apply a specific stash:
git stash apply stash@{1}

# Delete a specific stash:
git stash drop stash@{0}

# Clear all stashes:
git stash clear
```

---

### Q16: What is `git reflog` and how does it save you from disaster?

**Answer:**
`git reflog` (Reference Log) records every single time the `HEAD` pointer moved in your local repository (commits, resets, checkouts, merges, rebases).
Even if you run `git reset --hard` or delete a branch by mistake, the commits still exist as dangling objects in `.git` for up to 30–90 days before garbage collection.

#### How to recover a lost commit:
```bash
# 1. Inspect the history of HEAD movements
git reflog

# Output:
# a1b2c3d HEAD@{0}: reset: moving to HEAD~2
# e4f5g6h HEAD@{1}: commit: feat: completed dynamic RSA auth
# 7i8j9k0 HEAD@{2}: commit: feat: added Cashfree payout

# 2. You lost e4f5g6h! Recover it into a branch:
git switch -c recovered-branch e4f5g6h
```

---

### Q17: What is `git cherry-pick` and when would you use it?

**Answer:**
`git cherry-pick <commit-sha>` copies the exact changes introduced by a specific commit from another branch and applies them as a new commit onto your current branch.

#### Use cases:
1. **Critical Hotfix**: A bug fix was committed on `develop` or a feature branch, but you need it on production `main` immediately without releasing unverified features.
2. **Accidental Branch Commit**: You made a commit on `main` instead of `feature/auth`. You switch to `feature/auth`, cherry-pick the commit, and reset `main`.

```bash
git checkout main
git cherry-pick d4e5f6a
```

---

## 6. Git Hooks & Husky Automation

### Q18: What are Git Hooks? How do you use Husky and lint-staged in Node.js/NestJS?

**Answer:**
Git Hooks are custom scripts that execute automatically before or after Git events (e.g., `pre-commit`, `commit-msg`, `pre-push`). They reside in `.git/hooks/`.
Because `.git/hooks` is not committed to remote repositories, modern teams use **Husky** to version-control hooks.

#### Setup in a TypeScript / NestJS project:
```bash
npm install -D husky lint-staged
npx husky init
```

#### `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

#### `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.json": [
      "prettier --write"
    ]
  }
}
```

#### `.husky/commit-msg` (Enforce Conventional Commits):
```bash
npx --no -- commitlint --edit "$1"
```

---

## 7. Branching Strategies

### Q19: Compare GitFlow, GitHub Flow, and Trunk-Based Development.

**Answer:**

```
1. GitFlow:
   main ──────────────────────────────────────────────────────────
           \                                              /
   release  \──────────────────────────────[v1.0.0]──────/
             \                            /
   develop    \───────[feature]──────────/

2. GitHub Flow:
   main ──────┬─────────────────────────┬───────────────
               \─── feature ─── PR ────/

3. Trunk-Based Development:
   trunk (main) ───*───*───*───*───*───*─── (short-lived branches < 1 day, feature flags)
```

| Strategy | Description | Best For |
|---|---|---|
| **GitFlow** | Complex: `main`, `develop`, `feature/*`, `release/*`, `hotfix/*` | Traditional software with scheduled versioned releases (e.g., mobile apps, embedded) |
| **GitHub Flow** | Simple: `main` is always deployable. Create feature branches, open PR, review, merge to `main`, deploy. | Continuous Deployment (CD) web apps, SaaS |
| **Trunk-Based Development** | Developers merge small, frequent commits directly into `main` (trunk) daily. Features hidden behind **Feature Flags**. | High-performing DevOps teams, microservices, CI/CD with high test automation |

---

## 8. Real-World Interview Scenarios & Troubleshooting

### Scenario 1: "I accidentally committed and pushed a file containing an AWS Secret Key / Database Password to GitHub. What exact steps do you take?"

**Answer:**
1. **IMMEDIATE STEP**: Rotate / revoke the compromised credential immediately in AWS / Database console! Once pushed, bots scrape GitHub in seconds. Treat the secret as compromised.
2. Remove the file from Git tracking without deleting it locally:
   ```bash
   git rm --cached .env
   echo ".env" >> .gitignore
   git commit -m "chore: remove .env from git tracking"
   git push origin main
   ```
3. To rewrite history and purge the secret from all past commits, use `git-filter-repo` (recommended over deprecated `git filter-branch`) or BFG Repo-Cleaner:
   ```bash
   pip install git-filter-repo
   git-filter-repo --path .env --invert-paths
   git push origin --force --all
   ```

---

### Scenario 2: "I committed changes to `main` instead of creating a feature branch. I have not pushed yet. How do I fix this?"

**Answer:**
```bash
# 1. Create a new branch from current position (contains the new commits)
git branch feature/my-feature

# 2. Reset main back 1 commit (or to origin/main)
git reset --hard HEAD~1

# 3. Switch to your feature branch
git switch feature/my-feature
```

---

### Scenario 3: "How do you change the message of the most recent commit?"

**Answer:**
```bash
# If not pushed yet:
git commit --amend -m "feat(rides): correct commit message"

# If already pushed (exercise caution on shared branches):
git push --force-with-lease origin branch-name
```
> **Tip**: Always prefer `--force-with-lease` over `--force`. `--force-with-lease` refuses to overwrite remote changes if someone else pushed new commits to the branch since your last fetch.

---

### Scenario 4: "What is `git bisect` and when do you use it?"

**Answer:**
`git bisect` uses **Binary Search** across the commit history to locate the exact commit that introduced a bug or regression.

```bash
# 1. Start bisect mode
git bisect start

# 2. Mark current commit as broken
git bisect bad

# 3. Mark an older known working commit (e.g. tag v1.0.0)
git bisect good v1.0.0

# Git checks out the midpoint commit automatically.
# 4. Test the app:
npm test

# 5. Tell Git if it passes or fails:
git bisect good   # or git bisect bad

# 6. Repeat until Git outputs:
# "3a4f89d is the first bad commit"

# 7. End bisect session and return to original HEAD:
git bisect reset
```

---

## 9. Quick Revision & Command Cheat Sheet

| Command | What it does |
|---|---|
| `git switch -c <name>` | Create and switch to a new branch (modern replacement for `git checkout -b`) |
| `git status -s` | Short format status display |
| `git commit --amend` | Add staged changes into the last commit or change its message |
| `git reset --soft HEAD~1` | Undo last commit, keep changes staged |
| `git reset --mixed HEAD~1` | Undo last commit, keep changes in working directory unstaged |
| `git reset --hard HEAD~1` | Undo last commit and destroy all changes |
| `git revert <sha>` | Safely invert a commit with a new commit |
| `git clean -fd` | Force delete untracked files (`-f`) and directories (`-d`) |
| `git pull --rebase` | Fetch and rebase local commits on top of remote branch |
| `git push --force-with-lease` | Safe force push that checks if remote was modified by others |
| `git cherry-pick <sha>` | Apply a specific commit from another branch to current branch |
| `git reflog` | Complete local audit log of all `HEAD` pointer movements |
| `git log --oneline --graph --all` | ASCII branch visualization graph in terminal |
| `git stash pop` | Apply most recent stash and remove it from stash list |
