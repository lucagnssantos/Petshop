package backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI petgoOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("PetGO API")
                .description("API REST do sistema de gestão do petshop PetGO. " +
                    "Autentique-se via POST /api/usuarios/login para obter o token JWT " +
                    "e clique em Authorize para usá-lo.")
                .version("1.0.0")
                .contact(new Contact().name("PetGO").email("contato@petgo.com")))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Token JWT obtido via POST /api/usuarios/login")));
    }
}
