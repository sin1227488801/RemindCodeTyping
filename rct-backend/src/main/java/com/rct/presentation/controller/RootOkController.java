package com.rct.presentation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootOkController {
  @GetMapping("/")
  public String ok() { 
    return "OK"; 
  }
}