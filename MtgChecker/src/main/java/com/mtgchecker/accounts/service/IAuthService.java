package com.mtgchecker.accounts.service;

import com.mtgchecker.accounts.dto.request.LoginRequest;
import com.mtgchecker.accounts.dto.request.RefreshTokenRequest;
import com.mtgchecker.accounts.dto.request.RegisterRequest;
import com.mtgchecker.accounts.dto.response.AuthResponse;

public interface IAuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(RefreshTokenRequest request);
}
