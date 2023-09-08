#!/usr/bin/env bash
set -e
set -x


MY_PATH=$(realpath $(dirname "$0"))
TERRA_PATH=$(realpath ${MY_PATH}/../../terra)

mkdir -p ${MY_PATH}/build

