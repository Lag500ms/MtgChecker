package com.mtgchecker.accounts.service.impl;

import com.mtgchecker.accounts.dto.request.CreateRoleRequest;
import com.mtgchecker.accounts.dto.request.UpdateRoleRequest;
import com.mtgchecker.accounts.dto.response.RoleResponse;
import com.mtgchecker.accounts.entity.Role;
import com.mtgchecker.accounts.enums.AppPermissions;
import com.mtgchecker.accounts.repository.RoleRepository;
import com.mtgchecker.accounts.service.IRoleService;
import com.mtgchecker.exceptions.BadRequestException;
import com.mtgchecker.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements IRoleService {

    private final RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream()
                .map(RoleServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RoleResponse findById(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found with id: " + id));
        return toResponse(role);
    }

    @Override
    @Transactional
    public RoleResponse create(CreateRoleRequest request) {
        String name = request.getName().trim().toUpperCase();
        if (roleRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Role name already exists: " + name);
        }

        validatePermissions(request.getPermissions());

        Role role = Role.builder()
                .name(name)
                .description(request.getDescription())
                .system(false)
                .permissions(new HashSet<>(request.getPermissions()))
                .build();

        Role saved = roleRepository.save(role);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RoleResponse update(String id, UpdateRoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found with id: " + id));

        if (role.isSystem() && "ADMIN".equalsIgnoreCase(role.getName())) {
            throw new BadRequestException("Cannot modify system ADMIN role permissions");
        }

        validatePermissions(request.getPermissions());

        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }
        role.setPermissions(new HashSet<>(request.getPermissions()));

        Role saved = roleRepository.save(role);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Role not found with id: " + id));

        if (role.isSystem()) {
            throw new BadRequestException("Cannot delete system role: " + role.getName());
        }

        roleRepository.delete(role);
    }

    @Override
    public List<String> getAvailablePermissions() {
        return AppPermissions.ALL_PERMISSIONS;
    }

    private void validatePermissions(Set<String> permissions) {
        for (String perm : permissions) {
            if (!AppPermissions.ALL_PERMISSIONS.contains(perm)) {
                throw new BadRequestException("Invalid permission: " + perm + ". Allowed: " + AppPermissions.ALL_PERMISSIONS);
            }
        }
    }

    private static RoleResponse toResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .system(role.isSystem())
                .permissions(role.getPermissions())
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }
}
