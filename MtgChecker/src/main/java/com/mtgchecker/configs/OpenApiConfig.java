package com.mtgchecker.configs;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI(
            @Value("${application-title:MtgChecker API}") String title,
            @Value("${application-description:Look up Magic cards and track your collection.}") String description,
            @Value("${application-version:0.0.1}") String version,
            @Value("${application-server-url:}") String serverUrl
    ) {
        List<Server> servers = new ArrayList<>();
        servers.add(new Server().url("/").description("Current Host / Relative URL"));
        if (serverUrl != null && !serverUrl.isBlank() && !"/".equals(serverUrl.trim())) {
            servers.add(new Server().url(serverUrl).description("Configured Server URL"));
        }

        return new OpenAPI()
                .servers(servers)
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components().addSecuritySchemes("Bearer Authentication", bearerScheme()))
                .info(new Info()
                        .title(title)
                        .description(description)
                        .version(version));
    }

    private SecurityScheme bearerScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .bearerFormat("JWT")
                .scheme("bearer");
    }
}
