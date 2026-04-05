#!/bin/bash
# Google Search Console sitemap submission script

# საიტმაპის URL
SITEMAP_URL="https://13.online.ge/sitemap.xml"

# Check if sitemap is accessible
echo "Checking sitemap accessibility..."
curl -I "$SITEMAP_URL"

# Google Search Console API (optional - requires setup)
echo "Sitemap URL to submit manually: $SITEMAP_URL"
echo "Go to: https://search.google.com/search-console/"
echo "1. Select your property"
echo "2. Go to Sitemaps"
echo "3. Enter: sitemap.xml"
echo "4. Click Submit"

# Alternative: ping Google about sitemap update
echo "Pinging Google about sitemap update..."
curl "https://www.google.com/ping?sitemap=$SITEMAP_URL"

echo "Done! Check Google Search Console for indexing status."
