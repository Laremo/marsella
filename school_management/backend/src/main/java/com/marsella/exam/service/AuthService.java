package com.marsella.exam.service;

import com.marsella.exam.config.JwtUtils;
import com.marsella.exam.dto.AuthResponse;
import com.marsella.exam.dto.LoginRequest;
import com.marsella.exam.dto.RegisterRequest;
import com.marsella.exam.model.User;
import com.marsella.exam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Usuario o contraseña incorrectos");
        }

        String token = jwtUtils.generateToken(user.getUsername(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("El nombre de usuario ya está registrado");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El correo electrónico ya está registrado");
        }

        String assignedRole = "ROLE_TEACHER";
        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            String r = request.getRole().trim().toUpperCase();
            if (r.equals("ROLE_DIRECTOR") || r.equals("DIRECTOR")) {
                assignedRole = "ROLE_DIRECTOR";
            } else if (r.equals("ROLE_STUDENT") || r.equals("STUDENT") || r.equals("ALUMNO")) {
                assignedRole = "ROLE_STUDENT";
            } else {
                assignedRole = "ROLE_TEACHER";
            }
        }

        User user = User.builder()
                .username(request.getUsername().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .role(assignedRole)
                .build();

        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getUsername(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
