### GitHub Tag
- **Create a Git tag**:  
  ```bash
  git tag -a v0.1.0-beta.1 -m "Release v0.1.0-beta.1 for testing"
  git push origin v0.1.0-beta.1
  ```
- List current git tags
    ```bash
    git tag
    git ls-remote --tags origin
    ```
### npm publish

- **Debug publishing without actually publish:**
    - `npm publish --access public --tag beta --dry-run`
    - `npm publish --tag beta --dry-run`


### Git commit manipulation

- in case u want to modify a commit without creating new commits, especially if its not recent commit
```bash
git rebase -i --committer-date-is-author-date HEAD~X

GIT_COMMITTER_DATE="$(git show -s --format=%ci HEAD)" \
GIT_AUTHOR_DATE="$(git show -s --format=%ai HEAD)" \
git commit --amend --no-edit

git add . && git commit --amend && git rebase --continue
```
_`X = number of commits to pop out of stack to reach target commit`_