cmake_minimum_required(VERSION 3.11)

include(FetchContent)

project(cppast_backend)

set(CMAKE_CXX_STANDARD 17)

message(STATUS "Fetching cxxopts")
FetchContent_Declare(cxxopts URL https://github.com/jarro2783/cxxopts/archive/v3.0.0.zip)
FetchContent_MakeAvailable(cxxopts)

add_subdirectory("${CMAKE_CURRENT_SOURCE_DIR}/../terra" terra)

add_executable(cppast_backend "${CMAKE_CURRENT_SOURCE_DIR}/src/main.cc")
target_link_libraries(cppast_backend PRIVATE terra cxxopts)

if(APPLE)
    set_target_properties(cppast_backend PROPERTIES
        LINK_FLAGS "-Wl, -rpath @loader_path"
    )
elseif(UNIX)
    # TODO: add rpath to the executable
    # set_target_properties(cppast_backend PROPERTIES
    #     LINK_FLAGS "-Wl,-rpath,$ORIGIN/;$ORIGIN/lib"
    # )
endif()

# copy the libclang library to the build directory
add_custom_command(TARGET cppast_backend POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${LIBCLANG_LIBRARY}"
        $<TARGET_FILE_DIR:cppast_backend>)