cmake_minimum_required(VERSION 3.11)

set(CMAKE_CXX_STANDARD 17)

include(FetchContent)

project(terra)

set(LIBRARY_NAME terra)

set(HEADERS 
    ${CMAKE_CURRENT_SOURCE_DIR}/include/terra.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/include/terra_node.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/include/terra_parser.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/include/terra_generator.hpp
    )
add_library(${LIBRARY_NAME} STATIC ${CMAKE_CURRENT_SOURCE_DIR}/terra.cpp ${HEADERS})

set(V_NLOHMANN_JSON v3.10.5)

FetchContent_Declare(json URL https://github.com/nlohmann/json/releases/download/${V_NLOHMANN_JSON}/json.tar.xz)
FetchContent_MakeAvailable(json)

# add_executable(vistor main.cc)
add_subdirectory("${CMAKE_CURRENT_SOURCE_DIR}/third_party/cppast" cppast)

target_include_directories(${LIBRARY_NAME} PUBLIC 
                            "${CMAKE_CURRENT_SOURCE_DIR}/include/"
                            )

target_link_libraries(${LIBRARY_NAME} PUBLIC cppast nlohmann_json::nlohmann_json)