package com.mtgchecker.accounts.service;

import com.mtgchecker.accounts.dto.request.CreateRoleRequest;
import com.mtgchecker.accounts.dto.request.UpdateRoleRequest;
import com.mtgchecker.accounts.dto.response.RoleResponse;

import java.util.List;

public interface IRoleService {
    List<RoleResponse> findAll();
    RoleResponse findById(String id);
    RoleResponse create(CreateRoleRequest request);
    RoleResponse update(String id, UpdateRoleRequest request);
    void delete(String id);
    List<String> getAvailablePermissions();
}
