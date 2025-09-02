package com.rct.application.usecase.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.rct.application.usecase.auth.RegisterUserUseCase.RegistrationCommand;
import com.rct.application.usecase.auth.RegisterUserUseCase.RegistrationResult;
import com.rct.application.usecase.auth.RegisterUserUseCase.UserRegistrationException;
import com.rct.domain.model.user.LoginId;
import com.rct.domain.model.user.User;
import com.rct.domain.model.user.UserRepository;
import com.rct.service.PasswordService;
import com.rct.util.TestDataBuilder;
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
@DisplayName("RegisterUserUseCase")
class RegisterUserUseCaseTest {

  @Mock private UserRepository userRepository;
  @Mock private PasswordService passwordService;

  @InjectMocks private RegisterUserUseCase useCase;

  private String testLoginId;
  private String testPassword;
  private String encodedPassword;
  private User testUser;

  @BeforeEach
  void setUp() {
    testLoginId = "testuser";
    testPassword = "TestPassword123!";
    encodedPassword = "encoded-password-hash";
    testUser = TestDataBuilder.createUser(LoginId.of(testLoginId));
  }

  @Nested
  @DisplayName("execute method")
  class ExecuteMethod {

    @Test
    @DisplayName("should register user successfully with valid data")
    void shouldRegisterUserSuccessfully() {
      // Given
      RegistrationCommand command = new RegistrationCommand(testLoginId, testPassword);
      when(userRepository.existsByLoginId(any(LoginId.class))).thenReturn(false);
      when(passwordService.encode(testPassword)).thenReturn(encodedPassword);
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // When
      RegistrationResult result = useCase.execute(command);

      // Then
      assertThat(result.isSuccess()).isTrue();
      assertThat(result.getUser()).isEqualTo(testUser);
      assertThat(result.getErrorMessage()).isNull();

      // Verify user was saved
      ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
      verify(userRepository).save(userCaptor.capture());
      User savedUser = userCaptor.getValue();
      assertThat(savedUser.getLoginId().getValue()).isEqualTo(testLoginId);
    }

    @Test
    @DisplayName("should throw exception when user already exists")
    void shouldThrowExceptionWhenUserAlreadyExists() {
      // Given
      RegistrationCommand command = new RegistrationCommand(testLoginId, testPassword);
      when(userRepository.existsByLoginId(any(LoginId.class))).thenReturn(true);

      // When & Then
      assertThatThrownBy(() -> useCase.execute(command))
          .isInstanceOf(UserRegistrationException.class)
          .hasMessage("A user with this login ID already exists");

      verify(passwordService, never()).encode(anyString());
      verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("should throw exception when command is null")
    void shouldThrowExceptionWhenCommandIsNull() {
      // When & Then
      assertThatThrownBy(() -> useCase.execute(null))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("Registration command cannot be null");
    }

    @Test
    @DisplayName("should encode password before saving user")
    void shouldEncodePasswordBeforeSavingUser() {
      // Given
      RegistrationCommand command = new RegistrationCommand(testLoginId, testPassword);
      when(userRepository.existsByLoginId(any(LoginId.class))).thenReturn(false);
      when(passwordService.encode(testPassword)).thenReturn(encodedPassword);
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // When
      useCase.execute(command);

      // Then
      verify(passwordService).encode(testPassword);
      ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
      verify(userRepository).save(userCaptor.capture());
      User savedUser = userCaptor.getValue();
      assertThat(savedUser.getPasswordHash().getValue()).isEqualTo(encodedPassword);
    }

    @Test
    @DisplayName("should record initial login for new user")
    void shouldRecordInitialLoginForNewUser() {
      // Given
      RegistrationCommand command = new RegistrationCommand(testLoginId, testPassword);
      when(userRepository.existsByLoginId(any(LoginId.class))).thenReturn(false);
      when(passwordService.encode(testPassword)).thenReturn(encodedPassword);
      when(userRepository.save(any(User.class))).thenReturn(testUser);

      // When
      useCase.execute(command);

      // Then
      ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
      verify(userRepository).save(userCaptor.capture());
      User savedUser = userCaptor.getValue();
      // The user should have login statistics updated (initial login recorded)
      assertThat(savedUser.getTotalLoginDays()).isGreaterThan(0);
    }
  }

  @Nested
  @DisplayName("RegistrationCommand")
  class RegistrationCommandTest {

    @Test
    @DisplayName("should create command with valid parameters")
    void shouldCreateCommandWithValidParameters() {
      // When
      RegistrationCommand command = new RegistrationCommand("validuser", "ValidPass123!");

      // Then
      assertThat(command.getLoginId()).isEqualTo("validuser");
      assertThat(command.getPassword()).isEqualTo("ValidPass123!");
    }

    @Test
    @DisplayName("should throw exception when loginId is null")
    void shouldThrowExceptionWhenLoginIdIsNull() {
      // When & Then
      assertThatThrownBy(() -> new RegistrationCommand(null, "password"))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("Login ID cannot be null");
    }

    @Test
    @DisplayName("should throw exception when password is null")
    void shouldThrowExceptionWhenPasswordIsNull() {
      // When & Then
      assertThatThrownBy(() -> new RegistrationCommand("testuser", null))
          .isInstanceOf(NullPointerException.class)
          .hasMessage("Password cannot be null");
    }

    @Test
    @DisplayName("should throw exception when loginId is empty")
    void shouldThrowExceptionWhenLoginIdIsEmpty() {
      // When & Then
      assertThatThrownBy(() -> new RegistrationCommand("", "password"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Login ID cannot be empty");
    }

    @Test
    @DisplayName("should throw exception when password is empty")
    void shouldThrowExceptionWhenPasswordIsEmpty() {
      // When & Then
      assertThatThrownBy(() -> new RegistrationCommand("testuser", ""))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Password cannot be empty");
    }

    @Test
    @DisplayName("should throw exception when loginId is too short")
    void shouldThrowExceptionWhenLoginIdIsTooShort() {
      // When & Then
      assertThatThrownBy(() -> new RegistrationCommand("abc", "password"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Login ID must be between 4 and 50 characters");
    }

    @Test
    @DisplayName("should throw exception when loginId is too long")
    void shouldThrowExceptionWhenLoginIdIsTooLong() {
      // Given
      String longLoginId = "a".repeat(51);

      // When & Then
      assertThatThrownBy(() -> new RegistrationCommand(longLoginId, "password"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Login ID must be between 4 and 50 characters");
    }

    @Test
    @DisplayName("should throw exception when password is too short")
    void shouldThrowExceptionWhenPasswordIsTooShort() {
      // When & Then
      assertThatThrownBy(() -> new RegistrationCommand("testuser", "1234567"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Password must be between 8 and 100 characters");
    }

    @Test
    @DisplayName("should throw exception when password is too long")
    void shouldThrowExceptionWhenPasswordIsTooLong() {
      // Given
      String longPassword = "a".repeat(101);

      // When & Then
      assertThatThrownBy(() -> new RegistrationCommand("testuser", longPassword))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Password must be between 8 and 100 characters");
    }
  }

  @Nested
  @DisplayName("RegistrationResult")
  class RegistrationResultTest {

    @Test
    @DisplayName("should create success result")
    void shouldCreateSuccessResult() {
      // When
      RegistrationResult result = RegistrationResult.success(testUser);

      // Then
      assertThat(result.isSuccess()).isTrue();
      assertThat(result.getUser()).isEqualTo(testUser);
      assertThat(result.getErrorMessage()).isNull();
    }

    @Test
    @DisplayName("should create failure result")
    void shouldCreateFailureResult() {
      // Given
      String errorMessage = "Registration failed";

      // When
      RegistrationResult result = RegistrationResult.failure(errorMessage);

      // Then
      assertThat(result.isSuccess()).isFalse();
      assertThat(result.getUser()).isNull();
      assertThat(result.getErrorMessage()).isEqualTo(errorMessage);
    }
  }
}
