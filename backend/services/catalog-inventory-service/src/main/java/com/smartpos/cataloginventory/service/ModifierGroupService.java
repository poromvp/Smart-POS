package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.dto.request.ModifierGroupCreateRequest;
import com.smartpos.cataloginventory.dto.request.ModifierGroupUpdateRequest;
import com.smartpos.cataloginventory.dto.request.ModifierOptionRequest;
import com.smartpos.cataloginventory.dto.response.ModifierGroupResponse;
import com.smartpos.cataloginventory.dto.response.ModifierOptionResponse;

import java.util.List;

public interface ModifierGroupService {
    ModifierGroupResponse createGroup(ModifierGroupCreateRequest request);
    List<ModifierGroupResponse> getAllGroups();
    ModifierGroupResponse getGroupById(Long id);
    ModifierGroupResponse updateGroup(Long id, ModifierGroupUpdateRequest request);
    void deleteGroup(Long id);

    ModifierOptionResponse addOptionToGroup(Long groupId, ModifierOptionRequest request);
    void deleteOption(Long groupId, Long optionId);
}
