#!/usr/bin/env bash
set -e
set -x

# Find all the `__tests__`` directories to ensure there're test cases there
for d in **/*__tests__*; do 
    PACKAGE_DIR=$(realpath ${d}/..)
    echo "Running tests in ${PACKAGE_DIR}"; 
    pushd $PACKAGE_DIR
        npm install
        npm run test
    popd
done

