// Copyright (C) 2017-2022 Jonathan Müller and cppast contributors
// SPDX-License-Identifier: MIT

#include <cppast/diagnostic_logger.hpp>

#include <cstdio>
#include <mutex>

using namespace cppast;

bool diagnostic_logger::log(const char* source, const diagnostic& d) const
{
    if (!verbose_ && d.severity == severity::debug)
        return false;
    return do_log(source, d);
}

type_safe::object_ref<const diagnostic_logger> cppast::default_logger() noexcept
{
    static const stderr_diagnostic_logger logger(false);
    return type_safe::ref(logger);
}

type_safe::object_ref<const diagnostic_logger> cppast::default_verbose_logger() noexcept
{
    static const stderr_diagnostic_logger logger(true);
    return type_safe::ref(logger);
}

bool stderr_diagnostic_logger::do_log(const char* source, const diagnostic& d) const
{
    auto loc = d.location.to_string();
    if (loc.empty())
        std::fprintf(stderr, "[%s] [%s] %s\n", source, to_string(d.severity), d.message.c_str());
    else
        std::fprintf(stderr, "[%s] [%s] %s %s\n", source, to_string(d.severity),
                     d.location.to_string().c_str(), d.message.c_str());
    return true;
}
