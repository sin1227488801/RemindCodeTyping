package com.rct;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@SpringBootApplication
public class RctBackendApplication {

  public static void main(String[] args) {
    System.out.println("🚀 Starting RCT Backend Application...");
    SpringApplication.run(RctBackendApplication.class, args);
  }

  @EventListener(ApplicationReadyEvent.class)
  public void onApplicationReady() {
    System.out.println("✅ RCT Backend Application is READY and RUNNING!");
    System.out.println("🌐 Server should be accessible now");
  }
}
