package com.rct.integration;

import org.junit.platform.suite.api.IncludeClassNamePatterns;
import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

/**
 * Integration test suite that runs all integration tests in the integration package. This suite can
 * be executed to run all integration tests together, which is useful for CI/CD pipelines and
 * comprehensive testing.
 *
 * <p>Usage: - Run this class to execute all integration tests - Individual test classes can still
 * be run separately - CI pipeline can target this suite for integration test phase
 */
@Suite
@SuiteDisplayName("RCT Integration Test Suite")
@SelectPackages("com.rct.integration")
@IncludeClassNamePatterns({".*IntegrationTest.*", ".*TestSuite.*"})
public class IntegrationTestSuite {
  // This class serves as a test suite runner
  // No implementation needed - annotations handle the configuration
}
