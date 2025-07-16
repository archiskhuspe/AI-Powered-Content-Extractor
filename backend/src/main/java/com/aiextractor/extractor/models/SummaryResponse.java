package com.aiextractor.extractor.models;

import java.util.List;

/**
 * Model for API response containing summary and key points.
 */
public class SummaryResponse {
    private String summary;
    private List<String> keyPoints;

    public SummaryResponse() {}

    public SummaryResponse(String summary, List<String> keyPoints) {
        this.summary = summary;
        this.keyPoints = keyPoints;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<String> getKeyPoints() {
        return keyPoints;
    }

    public void setKeyPoints(List<String> keyPoints) {
        this.keyPoints = keyPoints;
    }
} 