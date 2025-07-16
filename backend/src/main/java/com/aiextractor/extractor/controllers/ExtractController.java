package com.aiextractor.extractor.controllers;

import com.aiextractor.extractor.models.SummaryResponse;
import com.aiextractor.extractor.services.HtmlExtractorService;
import com.aiextractor.extractor.services.SummarizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;
import java.util.Map;

/**
 * REST controller for content extraction and summarization API.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // TODO: Restrict to frontend origin in production
public class ExtractController {
    @Autowired
    private HtmlExtractorService htmlExtractorService;
    @Autowired
    private SummarizationService summarizationService;

    /**
     * POST /api/extract
     * Input: { url: string }
     * Output: { summary: string, keyPoints: [string, ...] }
     */
    @PostMapping("/extract")
    public ResponseEntity<?> extractContent(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        if (url == null || !isValidHttpUrl(url)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid or missing URL. Must start with http:// or https://"));
        }
        try {
            String text = htmlExtractorService.extractMainContent(url);
            if (text == null || text.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No extractable content found on the page."));
            }
            Map<String, Object> summaryResult = summarizationService.summarize(text, 5);
            String summary = (String) summaryResult.get("summary");
            List<String> keyPoints = (List<String>) summaryResult.get("keyPoints");
            return ResponseEntity.ok(new SummaryResponse(summary, keyPoints));
        } catch (MalformedURLException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Malformed URL."));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Failed to fetch or parse the page. It may be unavailable or JavaScript-heavy."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Unexpected error: " + e.getMessage()));
        }
    }

    // Helper: Validate HTTP/S URL
    private boolean isValidHttpUrl(String url) {
        try {
            URL u = new URL(url);
            return u.getProtocol().equals("http") || u.getProtocol().equals("https");
        } catch (Exception e) {
            return false;
        }
    }
} 