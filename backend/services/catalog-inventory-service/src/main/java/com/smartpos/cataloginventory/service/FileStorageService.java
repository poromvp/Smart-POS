package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.dto.response.FileUploadResponse;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");

    public FileStorageService(@Value("${app.upload.dir:uploads/products/}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            // Tự động tạo thư mục nếu chưa tồn tại
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new InvalidOperationException("Không thể khởi tạo thư mục lưu trữ file: " + ex.getMessage());
        }
    }

    public FileUploadResponse storeFile(MultipartFile file, HttpServletRequest request) {
        if (file.isEmpty()) {
            throw new InvalidOperationException("File tải lên không được để trống");
        }

        // Lấy tên file gốc
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        // Kiểm tra đuôi file hợp lệ
        String fileExtension = getFileExtension(originalFileName);
        if (!ALLOWED_EXTENSIONS.contains(fileExtension.toLowerCase())) {
            throw new InvalidOperationException("Định dạng file không được hỗ trợ. Chỉ chấp nhận: jpg, jpeg, png, webp");
        }

        // Tạo tên file mới bằng UUID để chống trùng lặp
        String storedFileName = UUID.randomUUID() + "." + fileExtension;

        try {
            // Lưu file vào thư mục đích
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Tạo link URL đầy đủ (ví dụ: http://localhost:8082/uploads/products/uuid.png)
            String fileUrl = ServletUriComponentsBuilder.fromRequestUri(request)
                    .replacePath("/uploads/products/" + storedFileName)
                    .build()
                    .toUriString();

            return FileUploadResponse.builder()
                    .originalFileName(originalFileName)
                    .storedFileName(storedFileName)
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .build();

        } catch (IOException ex) {
            throw new InvalidOperationException("Lỗi khi lưu trữ file " + originalFileName + ": " + ex.getMessage());
        }
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex == -1 || dotIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dotIndex + 1);
    }
}
