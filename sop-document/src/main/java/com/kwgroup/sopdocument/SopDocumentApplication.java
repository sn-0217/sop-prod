package com.kwgroup.sopdocument;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SopDocumentApplication {

	@jakarta.annotation.PostConstruct
	public void init() {
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
		System.out.println("Spring boot application running in IST timezone :" + new java.util.Date());
	}

	public static void main(String[] args) {
		SpringApplication.run(SopDocumentApplication.class, args);
	}

}
