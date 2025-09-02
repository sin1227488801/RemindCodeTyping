package com.rct.domain.model.user;

import java.util.Objects;

/**
 * Value object representing a user role in the system. Defines the permissions and access levels
 * for users.
 */
public class Role {

  public enum RoleType {
    ADMIN("ADMIN", "System Administrator"),
    USER("USER", "Regular User"),
    GUEST("GUEST", "Guest User");

    private final String code;
    private final String description;

    RoleType(String code, String description) {
      this.code = code;
      this.description = description;
    }

    public String getCode() {
      return code;
    }

    public String getDescription() {
      return description;
    }
  }

  private final RoleType roleType;

  private Role(RoleType roleType) {
    this.roleType = Objects.requireNonNull(roleType, "Role type cannot be null");
  }

  public static Role of(RoleType roleType) {
    return new Role(roleType);
  }

  public static Role admin() {
    return new Role(RoleType.ADMIN);
  }

  public static Role user() {
    return new Role(RoleType.USER);
  }

  public static Role guest() {
    return new Role(RoleType.GUEST);
  }

  public static Role fromString(String roleString) {
    if (roleString == null || roleString.trim().isEmpty()) {
      throw new IllegalArgumentException("Role string cannot be null or empty");
    }

    try {
      RoleType roleType = RoleType.valueOf(roleString.toUpperCase());
      return new Role(roleType);
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid role: " + roleString);
    }
  }

  public RoleType getRoleType() {
    return roleType;
  }

  public String getCode() {
    return roleType.getCode();
  }

  public String getDescription() {
    return roleType.getDescription();
  }

  public boolean isAdmin() {
    return roleType == RoleType.ADMIN;
  }

  public boolean isUser() {
    return roleType == RoleType.USER;
  }

  public boolean isGuest() {
    return roleType == RoleType.GUEST;
  }

  public boolean hasPermission(String permission) {
    return switch (roleType) {
      case ADMIN -> true; // Admin has all permissions
      case USER -> !permission.startsWith("ADMIN_"); // User has non-admin permissions
      case GUEST -> permission.startsWith("READ_"); // Guest has only read permissions
    };
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    Role role = (Role) obj;
    return roleType == role.roleType;
  }

  @Override
  public int hashCode() {
    return Objects.hash(roleType);
  }

  @Override
  public String toString() {
    return roleType.getCode();
  }
}
