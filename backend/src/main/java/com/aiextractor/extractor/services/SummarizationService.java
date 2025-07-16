package com.aiextractor.extractor.services;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service for summarizing extracted text using open-source NLP techniques or HuggingFace Inference API.
 */
@Service
public class SummarizationService {
    // Simple list of English stopwords
    private static final Set<String> STOPWORDS = Set.of(
            "the", "is", "in", "at", "of", "on", "and", "a", "to", "it", "for", "with", "as", "was", "were", "by", "an", "be", "this", "that", "from", "or", "are", "but", "not", "have", "has", "had", "they", "you", "we", "he", "she", "his", "her", "their", "our", "its", "which", "will", "would", "can", "could", "should", "may", "might", "do", "does", "did", "so", "if", "then", "than", "about", "into", "more", "other", "some", "any", "all", "no", "out", "up", "down", "over", "under", "again", "further", "once"
    );

    /**
     * Summarizes the given text using HuggingFace Inference API if available, otherwise frequency-based.
     * Produces a 2-3 paragraph summary and key points based on the main content.
     * @param text The input text
     * @param numSentences Number of sentences for summary (for fallback)
     * @return Map with keys: "summary" (String), "keyPoints" (List<String>)
     */
    public Map<String, Object> summarize(String text, int numSentences) {
        String apiKey = System.getenv("HUGGINGFACE_API_KEY");
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                System.out.println("Using HuggingFace API for summarisation");
                Map<String, Object> hfResult = summarizeWithHuggingFace(text, apiKey);
                if (hfResult != null) return hfResult;
            } catch (Exception e) {
                System.out.println("HuggingFace API failed, falling back to local summariser: " + e.getMessage());
                e.printStackTrace();
            }
        }
        System.out.println("Falling back to local summariser");
        return summarizeLocally(text, Math.max(numSentences, 10));
    }

    // --- HuggingFace Inference API summarization ---
    private Map<String, Object> summarizeWithHuggingFace(String text, String apiKey) throws IOException {
        // --- Chunked summarization logic ---
        List<String> chunks = splitTextIntoChunks(text, 500, 3); // Reduce chunk size to 500 chars
        List<String> chunkSummaries = new ArrayList<>();
        for (String chunk : chunks) {
            try {
                // Remove non-ASCII characters (optional, for safety)
                chunk = chunk.replaceAll("[^\\x00-\\x7F]", "");
                // Ensure chunk is no more than 500 characters
                if (chunk.length() > 500) {
                    chunk = chunk.substring(0, 500);
                }
                System.out.println("Preparing payload for chunk...");
                String payload = "{\"inputs\": " + escapeJson(chunk) + "}";
                System.out.println("Payload: " + payload);
                URL url = new URL("https://api-inference.huggingface.co/models/facebook/bart-large-cnn");
                System.out.println("Opening connection...");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Authorization", "Bearer " + apiKey);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                System.out.println("Sending request...");
                conn.getOutputStream().write(payload.getBytes());
                int code = conn.getResponseCode();
                System.out.println("HuggingFace API response code: " + code);
                if (code == 200) {
                    String response = new String(conn.getInputStream().readAllBytes());
                    String summaryText = extractSummaryFromHfResponse(response);
                    if (summaryText != null && !summaryText.isBlank()) {
                        chunkSummaries.add(summaryText.trim());
                    }
                } else {
                    String errorResponse = new String(conn.getErrorStream().readAllBytes());
                    System.out.println("HuggingFace error response: " + errorResponse);
                    System.out.println("Non-200 response from HuggingFace: " + code);
                }
            } catch (Exception ex) {
                System.out.println("Exception during HuggingFace API call: " + ex.getMessage());
                ex.printStackTrace();
            }
        }
    if (!chunkSummaries.isEmpty()) {
        String summary = String.join("\n\n", chunkSummaries).trim();
        summary = splitIntoParagraphs(summary, 3);
        List<String> keyPoints = extractKeyPointsFromSummary(summary, 7);
        return Map.of("summary", summary, "keyPoints", keyPoints);
    }
    return null;
}

    // Helper: Escape JSON string
    private String escapeJson(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    // Helper: Extract summary_text from HuggingFace response
    private String extractSummaryFromHfResponse(String response) {
        // Very basic extraction: look for "summary_text":"..."
        int idx = response.indexOf("summary_text");
        if (idx == -1) return null;
        int start = response.indexOf(":\"", idx);
        int end = response.indexOf("\"", start + 3);
        if (start == -1 || end == -1) return null;
        return response.substring(start + 2, end);
    }

    // Helper: Split summary into 2-3 paragraphs for display
    private String splitIntoParagraphs(String summary, int maxParagraphs) {
        List<String> sentences = splitIntoSentences(summary);
        int sentencesPerParagraph = Math.max(2, sentences.size() / maxParagraphs);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < sentences.size(); i++) {
            sb.append(sentences.get(i)).append(" ");
            if ((i + 1) % sentencesPerParagraph == 0 && (i + 1) < sentences.size()) {
                sb.append("\n\n");
            }
        }
        return sb.toString().trim();
    }

    // --- Key Points Extraction from Summary ---
    /**
     * Extracts up to maxKeyPoints distinct, important sentences from the summary itself.
     */
    private List<String> extractKeyPointsFromSummary(String summary, int maxKeyPoints) {
        List<String> sentences = splitIntoSentences(summary);
        Map<String, Integer> wordFreq = getWordFrequencies(summary);
        Map<String, Double> sentenceScores = new HashMap<>();
        for (String sentence : sentences) {
            double score = 0.0;
            for (String word : tokenize(sentence)) {
                if (!STOPWORDS.contains(word)) {
                    score += wordFreq.getOrDefault(word, 0);
                }
            }
            sentenceScores.put(sentence, score);
        }
        return sentenceScores.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .map(Map.Entry::getKey)
                .filter(s -> s.length() > 20 && s.length() < 200)
                .distinct()
                .limit(maxKeyPoints)
                .collect(Collectors.toList());
    }

    // --- Local frequency-based summarizer (fallback) ---
    private Map<String, Object> summarizeLocally(String text, int numSentences) {
        List<String> sentences = splitIntoSentences(text);
        if (sentences.isEmpty()) {
            return Map.of("summary", "", "keyPoints", List.of());
        }
        Map<String, Integer> wordFreq = getWordFrequencies(text);
        Map<String, Double> sentenceScores = new HashMap<>();
        for (String sentence : sentences) {
            double score = 0.0;
            for (String word : tokenize(sentence)) {
                if (!STOPWORDS.contains(word)) {
                    score += wordFreq.getOrDefault(word, 0);
                }
            }
            sentenceScores.put(sentence, score);
        }
        // Top N sentences for summary (longer summary)
        List<String> topSentences = sentenceScores.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(Math.max(numSentences, 10))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        // Group into paragraphs of 3-4 sentences
        StringBuilder summaryBuilder = new StringBuilder();
        for (int i = 0; i < topSentences.size(); i++) {
            summaryBuilder.append(topSentences.get(i)).append(" ");
            if ((i + 1) % 3 == 0) summaryBuilder.append("\n\n");
        }
        String summary = summaryBuilder.toString().trim();
        // Extract key points from the summary itself
        List<String> keyPoints = extractKeyPointsFromSummary(summary, 7);
        return Map.of("summary", summary, "keyPoints", keyPoints);
    }

    // Helper: Normalize sentence for duplicate detection
    private String normalizeSentence(String s) {
        return s.toLowerCase().replaceAll("[^a-z0-9 ]", "").trim();
    }

    // Helper: Split text into sentences (simple regex)
    private List<String> splitIntoSentences(String text) {
        return Arrays.stream(text.split("(?<=[.!?])\\s+"))
                .map(String::trim)
                .filter(s -> s.length() > 20)
                .collect(Collectors.toList());
    }

    // Helper: Tokenize and normalize words
    private List<String> tokenize(String text) {
        return Arrays.stream(text.toLowerCase().split("\\W+"))
                .filter(w -> w.length() > 2)
                .collect(Collectors.toList());
    }

    // Helper: Get word frequencies (excluding stopwords)
    private Map<String, Integer> getWordFrequencies(String text) {
        Map<String, Integer> freq = new HashMap<>();
        for (String word : tokenize(text)) {
            if (!STOPWORDS.contains(word)) {
                freq.put(word, freq.getOrDefault(word, 0) + 1);
            }
        }
        return freq;
    }

    // Helper: Split text into N chunks of maxChunkSize chars, up to maxChunks
    private List<String> splitTextIntoChunks(String text, int maxChunkSize, int maxChunks) {
        List<String> chunks = new ArrayList<>();
        int start = 0;
        int len = text.length();
        for (int i = 0; i < maxChunks && start < len; i++) {
            int end = Math.min(start + maxChunkSize, len);
            // Try to end at a sentence boundary if possible
            int lastPeriod = text.lastIndexOf('.', end);
            if (lastPeriod > start + 200 && lastPeriod < end) {
                end = lastPeriod + 1;
            }
            chunks.add(text.substring(start, end).trim());
            start = end;
        }
        return chunks;
    }
} 
