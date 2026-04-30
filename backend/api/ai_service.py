import requests
import logging
import json
import re
import time
from django.conf import settings

logger = logging.getLogger('api')

class GeminiBlogService:
    """Service to handle AI blog generation using OpenRouter API (DeepSeek/Mistral)."""
    
    def __init__(self):
        self.api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
        self.model = "deepseek/deepseek-chat"
        self.backup_model = "mistralai/mistral-7b-instruct"
        self.url = "https://openrouter.ai/api/v1/chat/completions"

    def _call_openrouter(self, messages, model=None):
        """Helper to make OpenRouter API calls with retry logic."""
        if not self.api_key:
            return None, "OpenRouter API Key not configured."

        target_model = model or self.model
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://markexo.com", # Site URL for OpenRouter rankings
            "X-Title": "Markexo eCommerce",
        }

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    self.url,
                    headers=headers,
                    json={
                        "model": target_model,
                        "messages": messages,
                        "response_format": { "type": "json_object" }
                    },
                    timeout=90
                )
                
                if response.status_code == 429:
                    wait_time = (attempt + 1) * 10
                    logger.warning(f"OpenRouter Rate Limited. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                
                response.raise_for_status()
                return response.json(), None

            except Exception as e:
                logger.warning(f"OpenRouter Attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    # Try backup model on last attempt if primary fails
                    if target_model == self.model:
                        logger.info(f"Switching to backup model: {self.backup_model}")
                        return self._call_openrouter(messages, model=self.backup_model)
                    return None, f"OpenRouter Error: {str(e)}"
                time.sleep(5)
        
        return None, "Failed after max retries."

    def generate_keywords_and_outline(self, product_name, description, category):
        """Generates target topic and primary keyword from product info."""
        prompt = f"""
        Analyze this product and provide:
        1. A catchy blog topic (SEO friendly).
        2. A high-intent primary SEO keyword.

        Product: {product_name}
        Category: {category}
        Description: {description}

        Return strictly as JSON:
        {{
            "topic": "The blog topic",
            "keyword": "primary keyword"
        }}
        """
        
        result, error = self._call_openrouter([{"role": "user", "content": prompt}])
        if error:
            return None, None, error
            
        try:
            content = result['choices'][0]['message']['content']
            data = json.loads(content)
            return data.get('topic'), data.get('keyword'), None
        except Exception as e:
            return None, None, f"Parsing Error: {str(e)}"

    def generate_complete_blog(self, product):
        """Main method to generate a full blog using the Master Prompt."""
        try:
            # Step 1: Get Topic and Keyword
            topic, keyword, error = self.generate_keywords_and_outline(
                product.name, product.description, product.category.name if product.category else "General"
            )
            
            if error:
                return None, f"Keyword generation failed: {error}"

            # Step 2: Use Master Prompt
            master_prompt_template = """
            You are an expert SEO content writer for an eCommerce website (VorionMart).
            Write a high-quality, human-like, and VERY DETAILED blog article based on the details below.

            🔹 Topic: {topic}
            🔹 Target Audience: Indian online shoppers
            🔹 Language: English (simple, engaging)
            🔹 Tone: Professional + friendly
            🔹 Word Count: Aim for 1500–1800 words (be very descriptive)

            ========================

            📌 REQUIREMENTS:

            1. SEO Optimized Title (max 60 characters)
            2. Meta Description (150–160 characters)
            3. URL Slug (SEO friendly)
            4. Excerpt: A 2-sentence catchy summary for the blog listing page.
            5. Introduction: Engaging, hook-based, identifying the shopper's pain points.
            6. Content Body: 
               - Use proper H2 & H3 headings.
               - Deeply analyze the features and benefits of the product.
               - Include a "Buying Guide" or "Why this matters" section.
               - Use bullet points and bold text for readability.
            7. Product Context: Explicitly refer to "{product_name}" available on VorionMart.
            8. Internal Linking: Add 2-3 suggestions like "Check our latest collection" or "View more from this category".
            9. FAQ Section: 5 schema-ready questions and answers.
            10. Conclusion: Strong summary with a clear CTA (Buy Now / Explore Products).

            ========================

            📌 SEO RULES:

            - Use primary keyword: {keyword}
            - Maintain keyword density naturally.
            - Add related keywords.
            - Write 100% unique content.

            ========================

            📌 OUTPUT FORMAT (STRICT JSON):

            {{
              "title": "SEO Title",
              "meta_description": "Meta description here",
              "slug": "url-slug-here",
              "excerpt": "Short excerpt here",
              "content": "Full HTML formatted blog content using <h2>, <h3>, <p>, <ul>, <li> tags. DO NOT use markdown code blocks inside this string.",
              "faqs": [
                {{"question": "Q1", "answer": "A1"}},
                {{"question": "Q2", "answer": "A2"}}
              ]
            }}
            """
            
            final_prompt = master_prompt_template.format(
                topic=topic,
                keyword=keyword,
                product_name=product.name
            )

            result, error = self._call_openrouter([{"role": "user", "content": final_prompt}])
            if error:
                return None, f"Content generation failed: {error}"

            content = result['choices'][0]['message']['content']
            # Remove markdown code blocks if present
            content = re.sub(r'```json\n?|\n?```', '', content).strip()
            
            blog_data = json.loads(content)
            
            # Ensure keywords field is added (required by views.py)
            blog_data['keywords'] = [keyword]
            
            return blog_data, None

        except Exception as e:
            logger.error(f"Generate Blog Error: {str(e)}")
            return None, f"Unexpected error: {str(e)}"
