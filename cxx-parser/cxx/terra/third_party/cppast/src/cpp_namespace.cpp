// Copyright (C) 2017-2022 Jonathan Müller and cppast contributors
// SPDX-License-Identifier: MIT

#include <cppast/cpp_namespace.hpp>

#include <cppast/cpp_entity_kind.hpp>

using namespace cppast;

cpp_entity_kind cpp_namespace::kind() noexcept
{
    return cpp_entity_kind::namespace_t;
}

cpp_entity_kind cpp_namespace::do_get_entity_kind() const noexcept
{
    return kind();
}

bool detail::cpp_namespace_ref_predicate::operator()(const cpp_entity& e)
{
    return e.kind() == cpp_entity_kind::namespace_t;
}

std::unique_ptr<cpp_namespace_alias> cpp_namespace_alias::build(const cpp_entity_index& idx,
                                                                cpp_entity_id id, std::string name,
                                                                cpp_namespace_ref target)
{
    auto ptr = std::unique_ptr<cpp_namespace_alias>(
        new cpp_namespace_alias(std::move(name), std::move(target)));
    idx.register_forward_declaration(std::move(id), type_safe::ref(*ptr));
    return ptr;
}

cpp_entity_kind cpp_namespace_alias::kind() noexcept
{
    return cpp_entity_kind::namespace_alias_t;
}

cpp_entity_kind cpp_namespace_alias::do_get_entity_kind() const noexcept
{
    return kind();
}

cpp_entity_kind cpp_using_directive::kind() noexcept
{
    return cpp_entity_kind::using_directive_t;
}

cpp_entity_kind cpp_using_directive::do_get_entity_kind() const noexcept
{
    return kind();
}

cpp_entity_kind cpp_using_declaration::kind() noexcept
{
    return cpp_entity_kind::using_declaration_t;
}

cpp_entity_kind cpp_using_declaration::do_get_entity_kind() const noexcept
{
    return kind();
}
