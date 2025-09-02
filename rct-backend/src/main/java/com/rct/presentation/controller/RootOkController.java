package com.rct.presentation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Simple root endpoint controller for Railway health checks
 * Returns 200 OK at root path to ensure deployment health check passes
 */
@RestController
public class RootOkController {

    /**
     * Root endpoint that returns OK status
     * Used for Railway deployment health checks
     * 
     * @return Simple OK message
     */
    @GetMapping("/")
    public String ok() {
        return "RCT Backend is running - OK";
    }

    /**
     * Additional health endpoint for redundancy
     * 
     * @return Simple health status
     */
    @GetMapping("/health")
    public String health() {
        return "UP";
    }
}