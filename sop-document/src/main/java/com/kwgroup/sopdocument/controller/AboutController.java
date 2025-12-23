package com.kwgroup.sopdocument.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import java.util.Map;
import java.util.HashMap;

import com.kwgroup.sopdocument.service.AboutService;

@RestController
@RequestMapping("/api/about")
@RequiredArgsConstructor
public class AboutController {
    private final AboutService aboutService;

    @GetMapping
    public ResponseEntity<Map<String, String>> getAbout() {
        Map<String, String> response = new HashMap<>();
        response.put("version", aboutService.getVersion());
        response.put("release", aboutService.getRelease());
        return ResponseEntity.ok(response);
    }
}
