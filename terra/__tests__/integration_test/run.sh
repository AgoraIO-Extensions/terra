#!/usr/bin/env bash
set -e
set -x


MY_PATH=$(realpath $(dirname "$0"))
TERRA_CLI_PATH=$(realpath ${MY_PATH}/../../)
PROJECT_PATH=$(realpath ${TERRA_CLI_PATH}/../)

# Clean up the build cache
rm -rf ${PROJECT_PATH}/cxx-parser/cxx/cppast_backend/build
rm -rf ${MY_PATH}/build

mkdir -p ${MY_PATH}/build

# Create an empty export file for dart
DART_EXPORT_FILE_PATH=${MY_PATH}/build/empty_export.dart
rm -rf ${DART_EXPORT_FILE_PATH}
touch ${DART_EXPORT_FILE_PATH}

pushd $TERRA_CLI_PATH

npm install

npm run build -- render-legacy \
    --config ${MY_PATH}/terra_config.yaml  \
    --output-dir=${MY_PATH}/build \
    --export-file-path=${DART_EXPORT_FILE_PATH}

npm run build -- render \
    --config ${MY_PATH}/terra_config.yaml  \
    --output-dir=${MY_PATH}/build

npm run build -- render \
    --config ${MY_PATH}/terra_config.yaml  \
    --output-dir=${MY_PATH}/build \
    --cache

npm run build -- render \
    --config ${MY_PATH}/terra_config.yaml  \
    --output-dir=${MY_PATH}/build \
    --cache=true

npm run build -- render \
    --config ${MY_PATH}/terra_config.yaml  \
    --output-dir=${MY_PATH}/build \
    --dump-ast-json

popd