#!/usr/bin/env bash

set -e

# This script will set up a local GNOME demo environment
# It creates a demo directory and then clones the localgnome repo
# into a series of demo projects, checking out custom branches in
# a few of those repos, creating a few changes in some of the repos,
# and resetting a few of the repos back a few commits to show off
# the status dashboard of localgnome without showing any real repos

sourceRepo="git@github.com:spalger/localgnome.git"
projectNames=(
  "frontend"
  "api"
  "graphql-layer-1"
  "graphql-layer-2"
  "data-ingestion"
  "data-processing"
  "data-storage"
  "data-visualization"
  "customer-portal"
  "admin-portal"
  "mobile-app"
  "documentation"
  "integration-testing"
)

# Create a demo directory
mkdir -p ../localgnome-demo
cd ../localgnome-demo

# clone the localgnome repo locally in a source dir, copy it into each of the project names, and then delete the source dir
git clone $sourceRepo source
for projectName in "${projectNames[@]}"
do
  cp -r source "$projectName"
done
rm -rf source

# create a few changes in the frontend project
cd frontend
git checkout -b spalger/my-awesome-feature-branch
echo "console.log('hello world')" >> src/index.ts
echo "console.log('hello world')" >> src/preload.ts
cd -

# create a few changes in the admin-portal project
cd admin-portal
git checkout -b spalger/changes-required-in-admin-portal-project
echo "console.log('hello world')" >> src/index.ts
cd -

# move the data-storage project back a few commits
cd data-storage
git reset --hard HEAD~3
cd -

# move the documentation project ahead a few commits
cd documentation
echo "console.log('hello world')" >> README.md
git add -A
git commit -m "add hello world to readme"
echo "console.log('hello world 2')" >> README.md
git add -A
git commit -m "add hello world to readme again"
cd -

echo "done!"


