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
        String cleanData = dbData.trim();
        // Xử lý trường hợp bị wrap bởi extra quotes như "\"[]\""
        if (cleanData.startsWith("\"") && cleanData.endsWith("\"") && cleanData.length() >= 2) {
            cleanData = cleanData.substring(1, cleanData.length() - 1).replace("\\\"", "\"").trim();
        }
        if (cleanData.isEmpty() || "[]".equals(cleanData)) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(cleanData, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            // Thử parse dạng phân tách dấu phẩy nếu là chuỗi id (e.g. "1,2,3")
            try {
                String[] parts = cleanData.replace("[", "").replace("]", "").split(",");
                List<Long> list = new ArrayList<>();
                for (String part : parts) {
                    String trimmed = part.trim();
                    if (!trimmed.isEmpty()) {
                        list.add(Long.parseLong(trimmed));
                    }
                }
                return list;
            } catch (Exception ignored) {
                log.warn("Lỗi khi chuyển đổi JSON String '{}' sang List<Long>: {}", cleanData, e.getMessage());
                return new ArrayList<>();
            }
        }
    }
}
