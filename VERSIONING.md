
### Version Format

```
MAJOR.MINOR.PATCH
e.g: 1.1.0
```

| Part    | When to Increment                                  | Example      |
|---------|----------------------------------------------------|--------------|
| MAJOR   | When there are **breaking changes** (incompatible changes) | `2.0.0` → `3.0.0` |
| MINOR   | When new **features** are added **backward-compatible** | `1.1.0` → `1.2.0` |
| PATCH   | When **bug fixes** or small improvements are made without breaking anything | `1.0.1` → `1.0.2` |

### Pre-release Versions

| Label     | Description                | Example      |
|-----------|----------------------------|--------------|
| alpha     | Early version for testing  | `1.0.0-alpha.1` |
| beta      | More stable but still for testing | `1.0.0-beta.1`  |
| rc (release candidate) | Final pre-release version | `1.0.0-rc.1` |

The number after the `beta.1` (e.g., `1.0.0-beta.1`) refers to the **iteration** or **release** of that specific pre-release version. Here’s what it means:

| Part        | Meaning                                      | Example      |
|-------------|----------------------------------------------|--------------|
| **beta.1**  | The first iteration of the **beta** version. This is the first time the beta version has been released for testing. | `1.0.0-beta.1` |
| **beta.2**  | The second iteration of the **beta** version, typically with fixes or improvements over `beta.1`. | `1.0.0-beta.2` |
| **beta.3**  | The third iteration, and so on. Each increment represents a new release with changes or fixes. | `1.0.0-beta.3` |

This numbering allows you to track the progress of the pre-release version (like a beta version) and understand how many iterations have been made before the final stable release.

### Summary Table

| Version Part | What It Means                              | Example     |
|--------------|--------------------------------------------|-------------|
| **MAJOR**    | Breaking changes (incompatible changes)    | `2.0.0` → `3.0.0` |
| **MINOR**    | New features (backward-compatible)         | `1.0.0` → `1.1.0` |
| **PATCH**    | Bug fixes or improvements                  | `1.0.0` → `1.0.1` |
| **Pre-release** | Early or unstable versions (e.g., alpha, beta) | `1.0.0-alpha.1` |

This simplified guide shows how version numbers are assigned based on the type of changes made in the software.