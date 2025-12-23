package com.kwgroup.sopdocument.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.Getter;

@Service
@Getter
public class AboutService {
    
    @Value("${spring.application.version}")
    private String version;
    
    @Value("${spring.application.release}")
    private String release;

}
