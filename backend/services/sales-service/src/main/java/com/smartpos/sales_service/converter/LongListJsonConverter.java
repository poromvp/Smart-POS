package com.smartpos.sales_service.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Converter
public class LongListJsonConverter implements AttributeConverter<List<Long>, String> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<Long> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            log.error("Lỗi khi chuyển đổi List<Long> sang JSON String: {}", e.getMessage());
            return "[]";
        }
    }

    @Override
    public List<Long> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank() || "null".equalsIgnoreCase(dbData.trim())) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            log.error("Lỗi khi chuyển đổi JSON String sang List<Long>: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}
