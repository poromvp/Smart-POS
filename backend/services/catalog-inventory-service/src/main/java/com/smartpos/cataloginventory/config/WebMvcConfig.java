package com.smartpos.cataloginventory.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/products/}")
    private String uploadDir;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Lấy đường dẫn tuyệt đối tới thư mục upload
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uploadAbsolutePath = uploadPath.toUri().toString();

        // Mọi request bắt đầu bằng /uploads/products/** sẽ tìm file trong thư mục upload trên ổ cứng
        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations(uploadAbsolutePath.endsWith("/") ? uploadAbsolutePath : uploadAbsolutePath + "/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Cấu hình CORS cho phép Frontend gọi API backend linh hoạt theo môi trường
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
