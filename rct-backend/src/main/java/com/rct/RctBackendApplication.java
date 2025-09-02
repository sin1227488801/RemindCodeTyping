package com.rct;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@SpringBootApplication(exclude = {
  org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration.class,
  org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration.class
})
public class RctBackendApplication {

  public static void main(String[] args) {
    System.out.println("🚀 Starting RCT Backend Application...");
    try {
      SpringApplication.run(RctBackendApplication.class, args);
      System.out.println("✅ SpringApplication.run completed successfully");
    } catch (Exception e) {
      System.err.println("❌ STARTUP FAILED: " + e.getMessage());
      e.printStackTrace();
      throw e;
    }
  }

  @EventListener(ApplicationReadyEvent.class)
  public void onApplicationReady() {
    System.out.println("✅ RCT Backend Application is READY and RUNNING!");
    System.out.println("🌐 Server should be accessible now");
  }
}
