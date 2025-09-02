package com.rct.config;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.filter.Filter;
import ch.qos.logback.core.spi.FilterReply;
import java.util.Arrays;
import java.util.List;

/**
 * Custom Logback filter to prevent sensitive information from being logged This filter checks log
 * messages for sensitive keywords and blocks them
 */
public class SensitiveDataFilter extends Filter<ILoggingEvent> {

  private static final List<String> SENSITIVE_KEYWORDS =
      Arrays.asList(
          "password",
          "token",
          "hash",
          "secret",
          "key",
          "credential",
          "auth",
          "jwt",
          "bearer",
          "authorization",
          "session",
          "cookie");

  @Override
  public FilterReply decide(ILoggingEvent event) {
    if (event == null || event.getFormattedMessage() == null) {
      return FilterReply.NEUTRAL;
    }

    String message = event.getFormattedMessage().toLowerCase();

    // Check if message contains any sensitive keywords
    for (String keyword : SENSITIVE_KEYWORDS) {
      if (message.contains(keyword)) {
        // Log a sanitized message instead
        return FilterReply.DENY;
      }
    }

    return FilterReply.NEUTRAL;
  }
}
