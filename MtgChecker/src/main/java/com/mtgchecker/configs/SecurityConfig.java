package com.mtgchecker.configs;

import com.mtgchecker.configs.ratelimit.RateLimitFilter;
import com.mtgchecker.configs.security.JwtAuthenticationEntryPoint;
import com.mtgchecker.configs.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final RateLimitFilter rateLimitFilter;
    private final JwtAuthenticationFilter jwtFilter;
    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/error",
                                "/health",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/auth/**"
                        ).permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/v1/bulk-data/sync").hasAnyAuthority("ROLE_ADMIN", "ROLE_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/bulk-data/**").permitAll()

                        .requestMatchers("/api/v1/cards/**", "/cards/**").permitAll()
                        .requestMatchers("/api/v1/rules/**", "/rules/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/sets/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/rulings/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/symbology/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/catalogs/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/migrations/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/v1/deck-formats", "/api/v1/deck-formats/**").permitAll()
                        .requestMatchers("/api/v1/deck-formats/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_MANAGE")

                        .requestMatchers(HttpMethod.GET, "/api/v1/inventory", "/api/v1/inventory/**").hasAnyAuthority("ROLE_ADMIN", "INVENTORY_VIEW")
                        .requestMatchers("/api/v1/inventory/**").hasAnyAuthority("ROLE_ADMIN", "INVENTORY_MANAGE")

                        .requestMatchers("/api/v1/roles/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_MANAGE")

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(rateLimitFilter, LogoutFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
