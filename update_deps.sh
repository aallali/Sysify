#!/bin/bash

outdated=$(npm outdated --json)

if [ -z "$outdated" ]; then
    echo "No outdated packages found."
    exit 0
fi

# Identify lock file type
if [ -f "yarn.lock" ]; then
    LOCK_FILE="yarn.lock"
elif [ -f "pnpm-lock.yaml" ]; then
    LOCK_FILE="pnpm-lock.yaml"
else
    LOCK_FILE="package-lock.json"
fi

for package in $(echo "$outdated" | jq -r 'keys[]'); do

    version=$(echo "$outdated" | jq -r ".\"$package\".latest")
    echo "Updating $package to version $version..."
    pnpm install "$package@$version"
    # Commit the update
    git add package.json $LOCK_FILE
    git commit -m "chore(deps): Update \`$package\` to \`$version\`"
done

echo "All outdated packages have been updated and committed."
