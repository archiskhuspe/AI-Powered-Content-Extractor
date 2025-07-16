package com.aiextractor.extractor.services;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URL;
import java.util.Comparator;

/**
 * Service for fetching and extracting main content from HTML pages using JSoup.
 */
@Service
public class HtmlExtractorService {
    /**
     * Fetches the HTML from the given URL and extracts the main content.
     * Tries <main>, <article>, or the largest <div> with text. Fallback to body.
     * Removes nav, footer, header, aside, scripts, styles, forms, ads, etc.
     * @param urlString The URL to fetch
     * @return Cleaned main text content
     * @throws IOException if fetching fails
     */
    public String extractMainContent(String urlString) throws IOException {
        URL url = new URL(urlString);
        Document doc = Jsoup.connect(url.toString())
                .userAgent("Mozilla/5.0 (compatible; AIContentExtractor/1.0)")
                .timeout(10000)
                .followRedirects(true)
                .get();

        // Remove unwanted elements
        String[] selectors = {"nav", "footer", "aside", "header", "form", "script", "style", "noscript", "ads", ".ads", "[role=advertisement]", "[aria-label=sidebar]", "[aria-label=footer]", "[aria-label=navigation]"};
        for (String selector : selectors) {
            Elements elements = doc.select(selector);
            for (Element el : elements) {
                el.remove();
            }
        }

        // Try <main>
        Element main = doc.selectFirst("main");
        if (main != null && main.text().length() > 200) {
            return main.text().trim();
        }
        // Try <article>
        Element article = doc.selectFirst("article");
        if (article != null && article.text().length() > 200) {
            return article.text().trim();
        }
        // Try largest <div> with text
        Elements divs = doc.select("div");
        Element largestDiv = divs.stream()
                .max(Comparator.comparingInt(e -> e.text().length()))
                .orElse(null);
        if (largestDiv != null && largestDiv.text().length() > 200) {
            return largestDiv.text().trim();
        }
        // Fallback: get body text
        String text = doc.body() != null ? doc.body().text() : "";
        return text.trim();
    }
} 