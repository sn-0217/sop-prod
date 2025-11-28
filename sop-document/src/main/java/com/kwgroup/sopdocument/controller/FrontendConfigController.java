package com.kwgroup.sopdocument.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FrontendConfigController {

    @Value("${app.server.name:localhost}")
    private String serverName;

    @Value("${server.port:8080}")
    private String serverPort;

    @GetMapping(value = "/config.js", produces = "application/javascript")
    public String getConfig() {
        String apiBaseUrl = "http://" + serverName + ":" + serverPort + "/api";
        return "window.RUNTIME_CONFIG = { API_BASE_URL: \"" + apiBaseUrl + "\" };";
    }
}
