
package com.nexushr.backend.controller;

import java.util.Map;

import com.nexushr.backend.service.AiInsightsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiInsightsController {

    private final AiInsightsService aiInsightsService;

    public AiInsightsController(AiInsightsService aiInsightsService) {
        this.aiInsightsService = aiInsightsService;
    }

    @GetMapping("/health")
    public Map<String, Object> getHealth() {
        return aiInsightsService.getHealth();
    }
}
