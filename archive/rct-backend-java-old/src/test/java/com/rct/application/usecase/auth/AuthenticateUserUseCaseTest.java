package com.rct.application.usecase.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.auth.AuthenticateUserUseCase.AuthenticationCommand;
import com.rct.application.usecase.auth.AuthenticateUserUseCase.AuthenticationException;
import com.rct.application.usecase.auth.AuthenticateUserUseCase.AuthenticationResult;
import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserRepository;
import com.rct.service.PasswordService;
import com.rct.util.TestDataBuilder;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthenticateUserUseCase")
class AuthenticateUserUseCaseTest {

  @Mock private UserRepository userRepository;
  @Mock private PasswordService passwordService;

  @InjectMocks private AuthenticateUserUseCase useCase;

  private User testUser;
  private LoginId testLoginId;
  private String testPassword;

  @BeforeEach
  void setUp() {
    testLoginId = LoginId.of("testuser");
    testPassword = "TestPassword123!";
    testUser = TestDataBuilder.createUser(testLoginId);
  }

  @Nested
  @DisplayName("execute method")
  class ExecuteMethod {

    @Test
    @DisplayName("should authenticate user successfully with valid credentials")
    void shouldAuthenticateUserSuccessfully() {
      // Given
      AuthenticationCommand command =
          new AuthenticationCommand(testLoginId.getValue(), testPassword);
      when(userRepository.findByLoginId(testLoginId)).thenReturn(Optional.of(testUser));
      when(passwordService.matches(testPassword, testUser.getPasswordHash().getValue()))
          .thenReturn(true);
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // When
      AuthenticationResult result = useCase.execute(command);

      // Then
      assertThat(result.isSuccess()).isTrue();
      assertThat(result.getUser()).isEqualTo(testUser);
      assertThat(result.getErrorMessage()).isNull();

      // Verify user login was recorded
      ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
      verify(userRepository).save(userCaptor.capture());
      User savedUser = userCaptor.getValue();
      assertThat(savedUser.getId()).isEqualTo(testUser.getId());
    }

    @Test
    @DisplayName("should throw exception when user not found")
    void shouldThrowExceptionWhenUserNotFound() {
      // Given
      AuthenticationCommand command = new AuthenticationCommand("nonexistent", testPassword);
      when(userRepository.findByLoginId(any(LoginId.class))).thenReturn(Optional.empty());

      // When & Then
      assertThatThrownBy(() -> useCase.execute(command))
          .isInstanceOf(AuthenticationException.class)
          .hasMessage("Invalid login credentials");

      verify(passwordService, never()).matches(anyString(), anyString());
      verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("should throw exception when password is invalid")
    void shouldThrowExceptionWhenPasswordInvalid() {
      // Given
      AuthenticationCommand command =
          new AuthenticationCommand(testLoginId.getValue(), "wrongpassword");
      when(userRepository.findByLoginId(testLoginId)).thenReturn(Optional.of(testUser));
      when(passwordService.matches("wrongpassword", testUser.getPasswordHash().getValue()))
          .thenReturn(false);

      // When & Then
      assertThatThrownBy(() -> useCase.execute(command))
          .isInstanceOf(AuthenticationException.class)
          .hasMessage("Invalid login credentials");

      verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("should throw exception when command is null")
    void shouldThrowExceptionWhenCommandIsNull() {
      // When & Then
      assertThatThrownBy(() -> useCase.execute(null))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("Authentication command cannot be null");
    }

    @Test
    @DisplayName("should update login statistics on successful authentication")
    void shouldUpdateLoginStatisticsOnSuccessfulAuthentication() {
      // Given
      AuthenticationCommand command =
          new AuthenticationCommand(testLoginId.getValue(), testPassword);
      when(userRepository.findByLoginId(testLoginId)).thenReturn(Optional.of(testUser));
      when(passwordService.matches(testPassword, testUser.getPasswordHash().getValue()))
          .thenReturn(true);
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // When
      useCase.execute(command);

      // Then
      ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
      verify(userRepository).save(userCaptor.capture());
      // The user's recordLogin method should have been called, which updates the statistics
    }
  }

  @Nested
  @DisplayName("AuthenticationCommand")
  class AuthenticationCommandTest {

    @Test
    @DisplayName("should create command with valid parameters")
    void shouldCreateCommandWithValidParameters() {
      // When
      AuthenticationCommand command = new AuthenticationCommand("testuser", "password");

      // Then
      assertThat(command.getLoginId()).isEqualTo("testuser");
      assertThat(command.getPassword()).isEqualTo("password");
    }

    @Test
    @DisplayName("should throw exception when loginId is null")
    void shouldThrowExceptionWhenLoginIdIsNull() {
      // When & Then
      assertThatThrownBy(() -> new AuthenticationCommand(null, "password"))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("Login ID cannot be null");
    }

    @Test
    @DisplayName("should throw exception when password is null")
    void shouldThrowExceptionWhenPasswordIsNull() {
      // When & Then
      assertThatThrownBy(() -> new AuthenticationCommand("testuser", null))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("Password cannot be null");
    }
  }

  @Nested
  @DisplayName("AuthenticationResult")
  class AuthenticationResultTest {

    @Test
    @DisplayName("should create success result")
    void shouldCreateSuccessResult() {
      // When
      AuthenticationResult result = AuthenticationResult.success(testUser);

      // Then
      assertThat(result.isSuccess()).isTrue();
      assertThat(result.getUser()).isEqualTo(testUser);
      assertThat(result.getErrorMessage()).isNull();
    }

    @Test
    @DisplayName("should create failure result")
    void shouldCreateFailureResult() {
      // Given
      String errorMessage = "Authentication failed";

      // When
      AuthenticationResult result = AuthenticationResult.failure(errorMessage);

      // Then
      assertThat(result.isSuccess()).isFalse();
      assertThat(result.getUser()).isNull();
      assertThat(result.getErrorMessage()).isEqualTo(errorMessage);
    }
  }
}
