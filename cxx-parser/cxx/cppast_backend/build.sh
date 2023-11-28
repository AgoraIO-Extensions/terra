#!/bin/bash

set -e
set -x

SCRIPT_PATH=$(dirname "$0")
MY_PATH=$(realpath ${SCRIPT_PATH})
OUTPUT_PATH=$1
ARGS=$2

if [ ! -d "${OUTPUT_PATH}" ]; then
    mkdir -p ${OUTPUT_PATH}
fi

pushd ${OUTPUT_PATH}

LLVM_CONFIG_BINARY=""
if [[ ! -z "${LLVM_DOWNLOAD_URL}" ]]; then
  echo "Use the llvm from the url: ${LLVM_DOWNLOAD_URL}"
  # Use the llvm from the url instead of the system installed one
  LLVM_CONFIG_BINARY=""
else
  echo "Use the llvm from the system"
  # Use the llvm from the system
  LLVM_CONFIG_BINARY=$(which llvm-config)
fi

# set LLVM_DOWNLOAD_URL env like 
# linux: https://github.com/llvm/llvm-project/releases/download/llvmorg-15.0.6/clang+llvm-15.0.6-x86_64-linux-gnu-ubuntu-18.04.tar.xz
# macos: https://github.com/llvm/llvm-project/releases/download/llvmorg-15.0.7/clang+llvm-15.0.7-x86_64-apple-darwin21.0.tar.xz
cmake \
    -DLLVM_CONFIG_BINARY=${LLVM_CONFIG_BINARY} \
    -DLLVM_DOWNLOAD_URL=${LLVM_DOWNLOAD_URL} \
    -DRUNTIME_OUTPUT_DIRECTORY=${OUTPUT_PATH} \
    ${MY_PATH}

cmake --build .

popd

pushd ${MY_PATH}
${OUTPUT_PATH}/cppast_backend ${ARGS}
popd
