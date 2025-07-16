package com.aiextractor.extractor.utils;

import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

/**
 * Utility methods for working with JSoup to extract and clean HTML content.
 */
public class JsoupUtils {
    /**
     * Removes unwanted elements from the document by CSS selector.
     */
    public static void removeElements(Document doc, String... selectors) {
        for (String selector : selectors) {
            Elements elements = doc.select(selector);
            for (Element el : elements) {
                el.remove();
            }
        }
    }
} 