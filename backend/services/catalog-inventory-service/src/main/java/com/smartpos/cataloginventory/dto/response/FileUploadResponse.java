package com.smartpos.cataloginventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    private String originalFileName; // Tên gốc của file người dùng tải lên
    private String storedFileName;   // Tên file đã được đổi sang UUID lưu trên server
    private String fileUrl;          // Đường dẫn URL đầy đủ để xem ảnh
    private Long fileSize;           // Kích thước file (bytes)
}
