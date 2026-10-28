package com.smartpos.cataloginventory.service.impl;

import com.smartpos.cataloginventory.domain.ModifierGroup;
import com.smartpos.cataloginventory.domain.ModifierOption;
import com.smartpos.cataloginventory.dto.request.ModifierGroupCreateRequest;
import com.smartpos.cataloginventory.dto.request.ModifierGroupUpdateRequest;
import com.smartpos.cataloginventory.dto.request.ModifierOptionRequest;
import com.smartpos.cataloginventory.dto.response.ModifierGroupResponse;
import com.smartpos.cataloginventory.dto.response.ModifierOptionResponse;
import com.smartpos.cataloginventory.exception.DuplicateResourceException;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.mapper.ModifierMapper;
import com.smartpos.cataloginventory.repository.ModifierGroupRepository;
import com.smartpos.cataloginventory.repository.ModifierOptionRepository;
import com.smartpos.cataloginventory.service.ModifierGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModifierGroupServiceImpl implements ModifierGroupService {

    private final ModifierGroupRepository modifierGroupRepository;
    private final ModifierOptionRepository modifierOptionRepository;
    private final ModifierMapper modifierMapper;

    @Override
    @Transactional
    public ModifierGroupResponse createGroup(ModifierGroupCreateRequest request) {
        if (modifierGroupRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Nhóm tùy chọn '" + request.getName() + "' đã tồn tại");
        }

        ModifierGroup group = modifierMapper.toEntity(request);
        group.setName(request.getName().trim());

        // Thiết lập liên kết quan hệ 2 chiều giữa Group và từng Option
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            for (ModifierOptionRequest optReq : request.getOptions()) {
                ModifierOption option = modifierMapper.toOptionEntity(optReq);
                option.setName(optReq.getName().trim());
                option.setGroup(group);
                group.getOptions().add(option);
            }
        }

        ModifierGroup saved = modifierGroupRepository.save(group);
        return modifierMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModifierGroupResponse> getAllGroups() {
        List<ModifierGroup> groups = modifierGroupRepository.findAllByOrderByNameAsc();
        return modifierMapper.toResponseList(groups);
    }

    @Override
    @Transactional(readOnly = true)
    public ModifierGroupResponse getGroupById(Long id) {
        ModifierGroup group = findGroupOrThrow(id);
        return modifierMapper.toResponse(group);
    }

    @Override
    @Transactional
    public ModifierGroupResponse updateGroup(Long id, ModifierGroupUpdateRequest request) {
        ModifierGroup group = findGroupOrThrow(id);

        if (request.getName() != null &&
                modifierGroupRepository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), id)) {
            throw new DuplicateResourceException("Tên nhóm tùy chọn '" + request.getName() + "' đã được sử dụng");
        }

        modifierMapper.updateEntityFromDto(request, group);
        if (request.getName() != null) {
            group.setName(request.getName().trim());
        }

        return modifierMapper.toResponse(group);
    }

    @Override
    @Transactional
    public void deleteGroup(Long id) {
        ModifierGroup group = findGroupOrThrow(id);

        // Chặn xóa nếu nhóm tùy chọn này đang được liên kết với sản phẩm
        if (group.getProducts() != null && !group.getProducts().isEmpty()) {
            throw new InvalidOperationException("Không thể xóa nhóm tùy chọn đang được gắn vào món ăn. Hãy gỡ khỏi món ăn trước");
        }

        modifierGroupRepository.delete(group);
    }

    @Override
    @Transactional
    public ModifierOptionResponse addOptionToGroup(Long groupId, ModifierOptionRequest request) {
        ModifierGroup group = findGroupOrThrow(groupId);

        if (modifierOptionRepository.existsByGroupIdAndNameIgnoreCase(groupId, request.getName().trim())) {
            throw new DuplicateResourceException("Tùy chọn '" + request.getName() + "' đã tồn tại trong nhóm này");
        }

        ModifierOption option = modifierMapper.toOptionEntity(request);
        option.setName(request.getName().trim());
        option.setGroup(group);

        ModifierOption saved = modifierOptionRepository.save(option);
        return modifierMapper.toOptionResponse(saved);
    }

    @Override
    @Transactional
    public void deleteOption(Long groupId, Long optionId) {
        findGroupOrThrow(groupId); // Kiểm tra group có tồn tại không
        ModifierOption option = modifierOptionRepository.findById(optionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tùy chọn với ID: " + optionId));

        if (!option.getGroup().getId().equals(groupId)) {
            throw new InvalidOperationException("Tùy chọn này không thuộc về nhóm chỉ định");
        }

        modifierOptionRepository.delete(option);
    }

    private ModifierGroup findGroupOrThrow(Long id) {
        return modifierGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm tùy chọn với ID: " + id));
    }
}
