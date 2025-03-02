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

PACKAGE_JSON_PATH=$(realpath ${MY_PATH}/../../package.json)
VERSION=$(awk -F'"' '/"version":/{print $4}' ${PACKAGE_JSON_PATH})
# Determine the prebuilt URL based on the operating system
OS=$(uname)
if [[ "$OS" == "Darwin" ]]; then
    PREBUILT_URL="https://github.com/AgoraIO-Extensions/terra/releases/download/v${VERSION}/cppast_backend_macos.zip"
elif [[ "$OS" == "Linux" ]]; then
    PREBUILT_URL="https://github.com/AgoraIO-Extensions/terra/releases/download/v${VERSION}/cppast_backend_ubuntu.zip"
else
    echo "Unsupported OS: $OS"
    exit 1
fi

# Check if CPPAST_BACKEND_BUILD is set to 1
# If it is set to 1, build the cppast_backend from source
# If it is not set, download the prebuilt cppast_backend
if [[ $CPPAST_BACKEND_BUILD != 1 ]]; then
    PREBUILT_FILE="${OUTPUT_PATH}/temp"

    if [ ! -f "${PREBUILT_FILE}" ]; then
        echo "Downloading prebuilt cppast_backend from ${PREBUILT_URL}"
        curl -L -o ${PREBUILT_FILE} ${PREBUILT_URL}
        unzip -o ${PREBUILT_FILE} -d ${OUTPUT_PATH}
        if [[ "$OS" == "Darwin" ]]; then
            mv ${OUTPUT_PATH}/macos/* ${OUTPUT_PATH}
            rmdir ${OUTPUT_PATH}/macos
        elif [[ "$OS" == "Linux" ]]; then
            mv ${OUTPUT_PATH}/ubuntu/* ${OUTPUT_PATH}
            rmdir ${OUTPUT_PATH}/ubuntu
        fi
        chmod +x ${OUTPUT_PATH}/cppast_backend
        # Add rpath in cmake
        # if [[ "$OS" == "Darwin" ]]; then
        #     install_name_tool -add_rpath ${OUTPUT_PATH} ${OUTPUT_PATH}/cppast_backend
        # fi
        if [[ "$OS" == "Linux" ]]; then
            sudo ln -s ${OUTPUT_PATH}/libclang.so ${OUTPUT_PATH}/libclang.so.15
            patchelf --set-rpath ${OUTPUT_PATH} ${OUTPUT_PATH}/cppast_backend
        fi
    else
        echo "Prebuilt cppast_backend already exists, skipping download."
    fi
else
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
fi

popd

pushd ${MY_PATH}
${OUTPUT_PATH}/cppast_backend ${ARGS}
popd
