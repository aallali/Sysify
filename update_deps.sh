#!/bin/bash

outdated=$(npm outdated --json)

if [ -z "$outdated" ]; then
    echo "No outdated packages found."
    exit 0
fi

# Identify lock file type
if [ -f "yarn.lock" ]; then
    LOCK_FILE="yarn.lock"
    NPM="yarn"
elif [ -f "pnpm-lock.yaml" ]; then
    LOCK_FILE="pnpm-lock.yaml"
    NPM="pnpm"
else
    LOCK_FILE="package-lock.json"
    NPM="npm"
fi

for package in $(echo "$outdated" | jq -r 'keys[]'); do
    version=$(echo "$outdated" | jq -r ".\"$package\".latest")
    
    # Skip prerelease versions (containing a hyphen) (e.g. "2.1.0-alpha", "2.1.0-beta", "2.1.0-rc.1")
    if [[ "$version" == *"-"* ]]; then
        echo "Skipping $package@$version as it appears to be a prerelease version"
        continue
    fi
    
    echo "Updating $package to version $version..."
    $NPM install "$package@$version"
    # Commit the update
    git add package.json $LOCK_FILE
    git commit -m "chore(deps): Update \`$package\` to \`$version\`"
    echo "chore(deps): Update \`$package\` to \`$version\`"
done

echo "All outdated packages have been updated and committed."
