"""
Advanced Kerala Review Generator for VorionMart Products.
Generates authentic, product-tailored, localized Kerala customer reviews (100+ reviews in 1-click)
with realistic Malayali personas, Kerala delivery hub mentions, and intelligent category-specific commentary.
"""

import random
import re
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Avg

from .models import Product, Review, Customer

# 160+ Diverse authentic Kerala customer personas across all 14 districts
KERALA_PERSONAS = [
    # Malabar region (Kozhikode, Kannur, Malappuram, Wayanad, Kasaragod)
    {"name": "Muhammed Fayis", "city": "Kozhikode", "pincode": "673001"},
    {"name": "Rahul Nair", "city": "Kozhikode", "pincode": "673004"},
    {"name": "Fathima Zahra", "city": "Malappuram", "pincode": "676505"},
    {"name": "Akhil K. Raj", "city": "Kannur", "pincode": "670001"},
    {"name": "Sneha Thomas", "city": "Wayanad", "pincode": "673121"},
    {"name": "Ajmal Khan", "city": "Tirur", "pincode": "676101"},
    {"name": "Keerthi Nambiar", "city": "Thalassery", "pincode": "670101"},
    {"name": "Jishnu Raj", "city": "Kozhikode", "pincode": "673016"},
    {"name": "Farhan K.", "city": "Manjeri", "pincode": "676121"},
    {"name": "Sharafudheen T.", "city": "Perinthalmanna", "pincode": "679322"},
    {"name": "Anoop V.", "city": "Vadakara", "pincode": "673101"},
    {"name": "Shahana Sherin", "city": "Kannur", "pincode": "670002"},
    {"name": "Rinshad K.", "city": "Kozhikode", "pincode": "673020"},
    {"name": "Vyshak N.", "city": "Payyanur", "pincode": "670307"},
    {"name": "Deepu K.", "city": "Kasaragod", "pincode": "671121"},
    {"name": "Amina N.", "city": "Malappuram", "pincode": "676509"},
    {"name": "Zameel A.", "city": "Kozhikode", "pincode": "673002"},
    {"name": "Irshad K.", "city": "Tirur", "pincode": "676104"},
    {"name": "Thasneem K.", "city": "Manjeri", "pincode": "676122"},
    {"name": "Shameer K.", "city": "Kozhikode", "pincode": "673010"},
    {"name": "Salih K.", "city": "Malappuram", "pincode": "676517"},
    {"name": "Rizwan K.", "city": "Kannur", "pincode": "670003"},
    {"name": "Rashid K.", "city": "Kozhikode", "pincode": "673015"},
    {"name": "Mansoor K.", "city": "Kanhangad", "pincode": "671315"},
    {"name": "Riyas K.", "city": "Malappuram", "pincode": "676501"},
    {"name": "Sabir M.", "city": "Kozhikode", "pincode": "673007"},
    {"name": "Irfan K.", "city": "Kannur", "pincode": "670014"},
    {"name": "Jaseel K.", "city": "Kozhikode", "pincode": "673011"},
    {"name": "Suhail K.", "city": "Malappuram", "pincode": "676503"},

    # Central Kerala (Ernakulam/Kochi, Thrissur, Palakkad, Alappuzha)
    {"name": "Anjali Menon", "city": "Kochi", "pincode": "682001"},
    {"name": "Vishnu Prasad", "city": "Thrissur", "pincode": "680001"},
    {"name": "Midhun Das", "city": "Palakkad", "pincode": "678001"},
    {"name": "Abhirami S.", "city": "Kochi", "pincode": "682016"},
    {"name": "Gokul Krishna", "city": "Thrissur", "pincode": "680020"},
    {"name": "Ashwin Varghese", "city": "Aluva", "pincode": "683101"},
    {"name": "Haritha P.", "city": "Palakkad", "pincode": "678006"},
    {"name": "Riya Mathew", "city": "Kakkanad", "pincode": "682030"},
    {"name": "Nithin K.", "city": "Thrissur", "pincode": "680005"},
    {"name": "Swathi Suresh", "city": "Alappuzha", "pincode": "688001"},
    {"name": "Kavya R.", "city": "Kochi", "pincode": "682025"},
    {"name": "Reshma R.", "city": "Angamaly", "pincode": "683572"},
    {"name": "Pranav M.", "city": "Thrissur", "pincode": "680503"},
    {"name": "Divya K.", "city": "Palakkad", "pincode": "678002"},
    {"name": "Bilal Ahmed", "city": "Kochi", "pincode": "682011"},
    {"name": "Sandra Philip", "city": "Muvattupuzha", "pincode": "686661"},
    {"name": "Sarath Chandran", "city": "Thrissur", "pincode": "680012"},
    {"name": "Meera Nair", "city": "Kochi", "pincode": "682036"},
    {"name": "Arjun S.", "city": "Alappuzha", "pincode": "688005"},
    {"name": "Sreehari K.", "city": "Palakkad", "pincode": "678010"},
    {"name": "Basil Paul", "city": "Kochi", "pincode": "682018"},
    {"name": "Shalini M.", "city": "Thrissur", "pincode": "680003"},
    {"name": "Vineeth V.", "city": "Kochi", "pincode": "682024"},
    {"name": "Neha Joseph", "city": "Chalakudy", "pincode": "680307"},
    {"name": "Gopika G.", "city": "Cherthala", "pincode": "688524"},
    {"name": "Alan Joy", "city": "Kochi", "pincode": "682017"},
    {"name": "Sooraj Mohan", "city": "Thrissur", "pincode": "680004"},
    {"name": "Shilpa S.", "city": "Palakkad", "pincode": "678007"},
    {"name": "Anjana B.", "city": "Kochi", "pincode": "682020"},
    {"name": "Amaldev P.", "city": "Alappuzha", "pincode": "688007"},
    {"name": "Arya Devi", "city": "Thrissur", "pincode": "680006"},
    {"name": "Jithin George", "city": "Perumbavoor", "pincode": "683542"},
    {"name": "Stephy Kurian", "city": "Kochi", "pincode": "682022"},
    {"name": "Asif Ali", "city": "Kalamassery", "pincode": "682033"},
    {"name": "Ancy Varghese", "city": "Kochi", "pincode": "682019"},
    {"name": "Hari Govind", "city": "Tripunithura", "pincode": "682301"},
    {"name": "Bhavana S.", "city": "Thrissur", "pincode": "680022"},
    {"name": "Treesa Babu", "city": "Kochi", "pincode": "682035"},
    {"name": "Rose Mary", "city": "Angamaly", "pincode": "683573"},
    {"name": "Lijo Jose", "city": "Thrissur", "pincode": "680007"},
    {"name": "Ansu Mathew", "city": "Kochi", "pincode": "682028"},
    {"name": "Sona Sunny", "city": "Irinjalakuda", "pincode": "680121"},
    {"name": "Sony Varghese", "city": "Kochi", "pincode": "682031"},
    {"name": "Liya Thomas", "city": "Aluva", "pincode": "683102"},
    {"name": "Rosemol George", "city": "Kochi", "pincode": "682015"},
    {"name": "Elizebeth John", "city": "Kakkanad", "pincode": "682037"},
    {"name": "Blessy George", "city": "Thrissur", "pincode": "680008"},
    {"name": "Albin Antony", "city": "Kochi", "pincode": "682026"},

    # South Kerala (Trivandrum, Kollam, Kottayam, Pathanamthitta, Idukki)
    {"name": "Dileep Mohan", "city": "Thiruvananthapuram", "pincode": "695001"},
    {"name": "Athira B.", "city": "Kollam", "pincode": "691001"},
    {"name": "Parvathy S.", "city": "Kottayam", "pincode": "686001"},
    {"name": "Archana R.", "city": "Thiruvananthapuram", "pincode": "695014"},
    {"name": "Renjith R.", "city": "Kollam", "pincode": "691004"},
    {"name": "Aiswarya K.", "city": "Thiruvalla", "pincode": "689101"},
    {"name": "Faizal M.", "city": "Kollam", "pincode": "691013"},
    {"name": "Lekshmi Priya", "city": "Thiruvananthapuram", "pincode": "695004"},
    {"name": "Sachin K.", "city": "Kottayam", "pincode": "686002"},
    {"name": "Surya S.", "city": "Thiruvananthapuram", "pincode": "695011"},
    {"name": "Hafiz K.", "city": "Kollam", "pincode": "691008"},
    {"name": "Tessy Thomas", "city": "Pala", "pincode": "686575"},
    {"name": "Sujith S.", "city": "Thiruvananthapuram", "pincode": "695005"},
    {"name": "Remya Mohan", "city": "Kottayam", "pincode": "686004"},
    {"name": "Naveen Raj", "city": "Kollam", "pincode": "691002"},
    {"name": "Kiran Kumar", "city": "Thiruvananthapuram", "pincode": "695015"},
    {"name": "Devika N.", "city": "Adoor", "pincode": "691523"},
    {"name": "Vipin V.", "city": "Thodupuzha", "pincode": "685584"},
    {"name": "Pooja Pillai", "city": "Kollam", "pincode": "691009"},
    {"name": "Vidya V.", "city": "Thiruvananthapuram", "pincode": "695008"},
    {"name": "Muneer K.", "city": "Attingal", "pincode": "695101"},
    {"name": "Abhijith R.", "city": "Kottayam", "pincode": "686016"},
    {"name": "Meenakshi M.", "city": "Thiruvananthapuram", "pincode": "695033"},
    {"name": "Ramees K.", "city": "Karunagappally", "pincode": "690518"},
    {"name": "Girish Kumar", "city": "Kollam", "pincode": "691021"},
    {"name": "Maya Nair", "city": "Thiruvananthapuram", "pincode": "695043"},
    {"name": "Nadeem P.", "city": "Varkala", "pincode": "695141"},
    {"name": "Sreerag R.", "city": "Changanassery", "pincode": "686101"},
    {"name": "Chithra M.", "city": "Thiruvananthapuram", "pincode": "695024"},
    {"name": "Anas K.", "city": "Kottayam", "pincode": "686005"},
    {"name": "Aparna S.", "city": "Kollam", "pincode": "691012"},
    {"name": "Nandhu K.", "city": "Thiruvananthapuram", "pincode": "695003"},
    {"name": "Saritha V.", "city": "Pathanamthitta", "pincode": "689645"},
    {"name": "Shahid M.", "city": "Kollam", "pincode": "691010"},
    {"name": "Geethu R.", "city": "Thiruvananthapuram", "pincode": "695012"},
    {"name": "Sandeep S.", "city": "Kottayam", "pincode": "686020"},
    {"name": "Varsha V.", "city": "Kollam", "pincode": "691007"},
    {"name": "Abhiram K.", "city": "Thiruvananthapuram", "pincode": "695019"},
    {"name": "Afzal M.", "city": "Kottarakkara", "pincode": "691506"},
    {"name": "Sivaprasad N.", "city": "Thiruvananthapuram", "pincode": "695025"},
    {"name": "Rajesh R.", "city": "Kollam", "pincode": "691015"},
    {"name": "Neethu Mohan", "city": "Kottayam", "pincode": "686010"},
    {"name": "Amritha S.", "city": "Thiruvananthapuram", "pincode": "695002"},
    {"name": "Nikhil N.", "city": "Punalur", "pincode": "691305"},
    {"name": "Deepthi R.", "city": "Thiruvananthapuram", "pincode": "695010"},
    {"name": "Unnikrishnan P.", "city": "Kollam", "pincode": "691005"},
    {"name": "Soumya S.", "city": "Kottayam", "pincode": "686006"},
    {"name": "Siraj K.", "city": "Thiruvananthapuram", "pincode": "695020"},
    {"name": "Sherin Joseph", "city": "Thiruvalla", "pincode": "689105"},
    {"name": "Adarsh M.", "city": "Kollam", "pincode": "691014"},
    {"name": "Dhanya K.", "city": "Thiruvananthapuram", "pincode": "695007"},
    {"name": "Sreejith S.", "city": "Kottayam", "pincode": "686008"},
    {"name": "Anusha M.", "city": "Kollam", "pincode": "691018"},
    {"name": "Bindu Nair", "city": "Thiruvananthapuram", "pincode": "695016"},
    {"name": "Aravind R.", "city": "Kottayam", "pincode": "686012"},
    {"name": "Sreepriya P.", "city": "Thiruvananthapuram", "pincode": "695022"},
    {"name": "Manu Mohan", "city": "Kollam", "pincode": "691016"},
    {"name": "Malavika S.", "city": "Thiruvananthapuram", "pincode": "695030"},
    {"name": "Chippy Babu", "city": "Kottayam", "pincode": "686015"},
    {"name": "Shyam Kumar", "city": "Thiruvananthapuram", "pincode": "695018"},
    {"name": "Athulya R.", "city": "Kollam", "pincode": "691020"},
    {"name": "Anoop S.", "city": "Thiruvananthapuram", "pincode": "695028"},
    {"name": "Aswathi K.", "city": "Kottayam", "pincode": "686018"},
    {"name": "Sunitha P.", "city": "Thiruvananthapuram", "pincode": "695035"},
    {"name": "Bipin Das", "city": "Kollam", "pincode": "691017"},
    {"name": "Devanand S.", "city": "Thiruvananthapuram", "pincode": "695036"},
    {"name": "Minu Varghese", "city": "Thiruvalla", "pincode": "689107"},
    {"name": "Sanjay Kumar", "city": "Kollam", "pincode": "691022"},
    {"name": "Archana Nair", "city": "Thiruvananthapuram", "pincode": "695038"},
    {"name": "Ganga S.", "city": "Kottayam", "pincode": "686025"},
    {"name": "Gayathri M.", "city": "Thiruvananthapuram", "pincode": "695040"},
]

# Kerala delivery snippets
DELIVERY_SNIPPETS = [
    "Reached {city} in just 2 days.",
    "Prompt delivery to {city}, very neatly packed.",
    "Delivered fast in {city} with safe bubble wrap.",
    "Courier reached {city} without any damage.",
    "Received within 48 hours at my home in {city}.",
    "Fast delivery by VorionMart to {city}.",
    "Packaging was top notch, reached {city} safely.",
    "Cash on delivery experience in {city} was super smooth.",
    "Arrived in {city} on time as promised.",
    "Prompt service in {city}, delivery partner was polite.",
]

# Category-specific template bank
CATEGORY_TEMPLATES = {
    "watch": {
        "keywords": ["watch", "watches", "timepiece", "chronograph", "dial", "analog", "quartz", "smartwatch", "wrist watch", "metal strap"],
        "openings_5star": [
            "Adipoli watch! The dial finish and weight feel super premium.",
            "Really impressive timepiece. Looks much more expensive than its price.",
            "Valare nannayittund! Dial clarity is sharp and strap fitting is very comfortable.",
            "Pakka quality! Heavy stainless steel build, finish looks classy.",
            "Super stylish watch! Got many compliments from office colleagues.",
            "Crown adjustment and quartz movement are very smooth and accurate.",
            "Best watch purchase from VorionMart. Sturdy metal strap and secure clasp.",
            "Looks stunning on wrist. Premium glass with great reflection resistance.",
        ],
        "openings_4star": [
            "Good watch for everyday office and casual use. Keeps accurate time.",
            "Nice dial and sturdy strap. Adjusted 1 link for my wrist size, now fits perfectly.",
            "Classy look, dial glass has good scratch resistance. Decent buy.",
            "Value for money watch. Packaging came in a neat presentation box.",
            "Solid metal build. Looks rich and feels durable.",
        ],
        "openings_3star": [
            "Looks good on wrist, strap was slightly stiff initially but got better.",
            "Decent timepiece for the price, dial is slightly heavier than expected.",
        ],
        "features": [
            "The metal strap clasp clicks securely without any wobble.",
            "Dial markers and hands are very easy to read even in dim light.",
            "Dial glass has nice clarity and doesn't pick up smudges easily.",
            "Pairs nicely with both formal office shirts and casual outfits.",
            "Battery was pre-installed and running with zero time lag.",
            "Water resistance held up fine during light Kerala drizzle.",
        ],
        "closings": [
            "Highly recommended for daily wear and formal occasions.",
            "Superb gifting option for brothers, husbands, and friends.",
            "Five stars for quality and fast delivery!",
            "Adipoli watch from VorionMart, go for it!",
            "Very satisfied with this purchase!",
        ]
    },

    "perfume": {
        "keywords": ["perfume", "fragrance", "scent", "cologne", "edp", "edc", "attar", "body spray", "deodorant", "oud"],
        "openings_5star": [
            "Adipoli fragrance set! All bottles have distinct rich notes.",
            "Really impressed with the scent quality. Feels very luxury.",
            "Valare nannayittund! Lasts throughout my work shift.",
            "Super quality perfumes. Fragrance projection is really good.",
            "Pure luxury feel at an affordable price point.",
            "Best perfume combo I bought recently on VorionMart.",
            "Pakka quality! Dominus and CEO scents are my daily favorites.",
            "Bought as a gift set, the gold gift box looks very premium.",
            "Long lasting scent even in Kerala's warm weather.",
            "Pleasant dry-down aroma, does not give any headache at all.",
            "Very convenient 20ml pocket size for keeping in bike or office bag.",
            "Sprayed in the morning and could still smell it in the evening.",
        ],
        "openings_4star": [
            "Good fragrance set. Lasts around 5 to 6 hours on clothes.",
            "Nice collection of scents. Two of the bottles are exceptional.",
            "Value for money set. Oud is strong and rich, others are fresh.",
            "Decent longevity for daily office and casual outing use.",
            "Good combo, nice packing. Scent projection is moderate.",
        ],
        "openings_3star": [
            "Fragrance is good, but longevity on skin is around 3-4 hours.",
            "Nice bottles and presentation, smell is pleasant but subtle.",
        ],
        "features": [
            "The atomiser spray nozzle produces a very fine mist.",
            "CEO and Oud variants have very rich wood and citrus notes.",
            "Does not leave any stains on white shirts.",
            "Got compliments from my colleagues at office.",
            "Ideal for parties, weddings, and formal office wear.",
            "Compact bottles make it very easy to carry during travel.",
            "Notes settle down into a very soothing base after 10 minutes.",
            "High concentration EDP that performs better than market sprays.",
        ],
        "closings": [
            "Highly recommended for anyone looking for a luxury perfume set.",
            "Definite re-order from VorionMart once this finishes.",
            "Worth every single rupee!",
            "Satisfied customer from Kerala.",
            "Adipoli purchase, 10/10!",
            "Great gifting option for birthdays and celebrations.",
        ]
    },

    "electronics": {
        "keywords": ["cable", "charger", "usb", "wire", "adapter", "power", "gadget", "holder", "clip", "stand", "mount", "organizer", "mouse", "keyboard", "earphone", "headphone", "audio"],
        "openings_5star": [
            "Adipoli build quality! Exactly what I needed for my desk setup.",
            "Super handy product. Very durable and well-engineered.",
            "Pakka quality gadget accessory! Cleaned up all my tangled cords.",
            "Excellent finish and sturdy material. Works like a charm.",
            "Valare nannayittund! Strong grip and very reliable.",
            "Super useful purchase from VorionMart. Sturdy construction.",
            "Adhesive stickiness is very powerful on wooden table.",
        ],
        "openings_4star": [
            "Good product. Does the job well and holds wires firmly.",
            "Build quality is solid for this price tag. Fast delivery.",
            "Nice utility item. Helps keep desk tidy and organized.",
            "Useful gadget accessory, delivered in good condition.",
        ],
        "openings_3star": [
            "Decent build, works fine. Make sure to clean surface before sticking.",
            "Average quality, serves the basic purpose.",
        ],
        "features": [
            "Holds thick cables without slipping off.",
            "Doesn't come loose even after weeks of regular use.",
            "Sleek and minimal design looks neat on workstation.",
            "Very simple and quick installation.",
            "Saves desk space and prevents cables from dropping behind.",
        ],
        "closings": [
            "Must buy for work from home desk setups.",
            "Worth the money, very satisfied.",
            "Good value product from VorionMart.",
            "Will recommend to friends and colleagues.",
            "Super handy, five stars!",
        ]
    },

    "apparel": {
        "keywords": ["shirt", "t-shirt", "tshirt", "kurti", "saree", "dress", "pant", "pants", "jeans", "trousers", "cotton", "kurta", "cloth", "clothing", "fabric", "hoodie", "trackpant"],
        "openings_5star": [
            "Adipoli fabric quality! Pure soft cotton feel.",
            "Very comfortable to wear, especially in Kerala's humid climate.",
            "Fitting is 100% accurate as per the size chart.",
            "Color matches exactly as shown in the product pictures.",
            "Stitching and finishing are top grade. Valare nannayittund!",
            "Super material quality! Felt premium from the first touch.",
        ],
        "openings_4star": [
            "Good cloth material. Fits nicely and breathable fabric.",
            "Nice dress. Color is vibrant and no shrinkage after first wash.",
            "Decent stitch quality. Good daily wear option.",
        ],
        "openings_3star": [
            "Fitting is slightly loose for me, but fabric quality is okay.",
            "Decent cloth, color is slightly lighter than photo.",
        ],
        "features": [
            "No color bleeding during machine washing.",
            "Soft texture that feels very gentle against skin.",
            "Comfortable cut that allows free movement.",
            "Premium buttons and reinforced seam stitching.",
        ],
        "closings": [
            "Will purchase more colors from VorionMart.",
            "Value for money clothing buy.",
            "Very happy with this order!",
            "Adipoli quality, go for it!",
        ]
    },

    "footwear": {
        "keywords": ["shoe", "shoes", "sandal", "sandals", "slipper", "slippers", "sneaker", "footwear", "flip flop"],
        "openings_5star": [
            "Super comfortable sole! Good cushioning for walking.",
            "Adipoli footwear! Perfect grip even during rainy season in Kerala.",
            "Valare nannayittund! Very lightweight and stylish look.",
            "Size fits like a glove. Cushioning gives zero heel pain.",
        ],
        "openings_4star": [
            "Good pair of footwear. Sole has nice flex and durability.",
            "Comfortable for daily commute and walking.",
            "Decent build quality for this price.",
        ],
        "openings_3star": [
            "Slightly tight around toes initially, got comfortable after 2 days.",
            "Basic footwear, looks good for casual use.",
        ],
        "features": [
            "Anti-skid rubber bottom provides firm footing.",
            "Sturdy straps that don't bite or cause blisters.",
            "Durable upper material that cleans easily with wet cloth.",
        ],
        "closings": [
            "Highly recommended comfortable daily wear.",
            "Great buy from VorionMart.",
            "Five stars for comfort!",
        ]
    },

    "beauty": {
        "keywords": ["cream", "serum", "lotion", "oil", "soap", "face", "skin", "hair", "shampoo", "beauty", "cosmetic", "glow", "scrub", "gel"],
        "openings_5star": [
            "Super gentle on skin! Noticeable difference within a week.",
            "Adipoli product! Non-sticky and absorbs quickly.",
            "Valare nannayittund! Subtle natural fragrance, zero irritation.",
            "Very soothing formula. Gives a healthy fresh glow.",
            "Pakka genuine product delivered safely.",
        ],
        "openings_4star": [
            "Good skincare product. Mild smell and hydrating texture.",
            "Decent results after two weeks of consistent usage.",
            "Suitable for combination skin type in tropical weather.",
        ],
        "openings_3star": [
            "Average results, moisturizes well but takes time to absorb.",
            "Okay product for regular routine.",
        ],
        "features": [
            "No harsh chemicals or strong artificial scents.",
            "Keeps skin soft and hydrated throughout the day.",
            "Lightweight consistency that doesn't feel greasy in humidity.",
        ],
        "closings": [
            "Ordering my second bottle now!",
            "Very satisfied with genuine VorionMart delivery.",
            "Must try for everyday personal care.",
        ]
    },

    "home_kitchen": {
        "keywords": ["kitchen", "home", "bottle", "box", "cookware", "pan", "rack", "storage", "knife", "tiffin", "cleaning", "mop", "cutter", "decor"],
        "openings_5star": [
            "Adipoli kitchen utility! Makes daily cooking so much easier.",
            "Super sturdy build! Not like cheap flimsy plastic items.",
            "Valare nannayittund! Saves lot of space on my counter.",
            "Excellent finishing and food-grade safe material.",
            "Very easy to wash and maintain. Great buy for home.",
        ],
        "openings_4star": [
            "Useful kitchen tool. Good quality stainless steel/plastic.",
            "Good product for home use. Packing was very safe.",
            "Decent size and sturdy build for daily tasks.",
        ],
        "openings_3star": [
            "Product is okay, serves the intended kitchen use.",
            "Slightly smaller than expected, but works well.",
        ],
        "features": [
            "Dishwasher and hand-wash friendly.",
            "Durable hinges and firm locking mechanism.",
            "Compact space saver for modern apartments.",
        ],
        "closings": [
            "Mom was very happy with this product!",
            "Must have for every Kerala household.",
            "Super value for money from VorionMart.",
        ]
    },

    "general": {
        "keywords": [],
        "openings_5star": [
            "Adipoli product! Quality is outstanding for this price.",
            "Valare nannayittund! Exactly what was described on website.",
            "Super satisfied with this purchase from VorionMart.",
            "Pakka quality! Arrived safely and works flawlessly.",
            "Very genuine product, delivered with proper packaging.",
            "100% value for money buy. Exceeded my expectations.",
        ],
        "openings_4star": [
            "Good product. Matches the pictures and description.",
            "Nice quality and fast delivery. Very satisfied.",
            "Decent purchase, would recommend to others.",
            "Good value for money. Prompt service.",
        ],
        "openings_3star": [
            "Product is okay, works as advertised.",
            "Average experience, but fair deal for the price.",
        ],
        "features": [
            "Looks very premium in hand.",
            "Packaging was properly sealed with tamper tape.",
            "Material quality feels long-lasting.",
        ],
        "closings": [
            "Happy customer from Kerala!",
            "Will definitely buy again from VorionMart.",
            "Recommended product!",
            "Worth every rupee spent.",
        ]
    }
}


def detect_product_category(product: Product) -> str:
    """Detects the category theme based on product name, category name, and description."""
    text = f"{product.name} {getattr(product.category, 'name', '')} {getattr(product.category, 'slug', '')} {product.description or ''}".lower()
    
    for cat_key, config in CATEGORY_TEMPLATES.items():
        if cat_key == "general":
            continue
        for kw in config["keywords"]:
            if re.search(r'\b' + re.escape(kw) + r'\b', text):
                return cat_key

    return "general"


def generate_single_review_text(product: Product, category_key: str, rating: int, city: str, tone: str = "natural") -> str:
    """Generates a contextual, realistic Kerala review text."""
    cat_data = CATEGORY_TEMPLATES.get(category_key, CATEGORY_TEMPLATES["general"])
    general_data = CATEGORY_TEMPLATES["general"]

    # Choose opening based on rating
    if rating == 5:
        openings = cat_data.get("openings_5star") or general_data["openings_5star"]
    elif rating == 4:
        openings = cat_data.get("openings_4star") or general_data["openings_4star"]
    else:
        openings = cat_data.get("openings_3star") or general_data["openings_3star"]

    opening = random.choice(openings)
    feature = random.choice(cat_data.get("features", general_data["features"]))
    delivery = random.choice(DELIVERY_SNIPPETS).format(city=city)
    closing = random.choice(cat_data.get("closings", general_data["closings"]))

    # Clean product specific mentions if applicable (e.g. if product has brand or pack size)
    prod_mention = ""
    if "4x20" in product.name.lower() or "combo" in product.name.lower() or "gift set" in product.name.lower():
        perfume_specials = [
            "Having 4 different bottles in one set is super practical.",
            "Gave CEO to my brother and kept Impact and Oud for myself.",
            "The combo box looks very attractive for keeping on dresser.",
        ]
        if random.random() < 0.4:
            prod_mention = random.choice(perfume_specials) + " "

    # Assemble based on tone
    if tone == "concise":
        # 1-2 punchy sentences
        if random.random() < 0.5:
            return f"{opening} {delivery} {closing}"
        return f"{opening} {closing}"

    elif tone == "detailed":
        # Comprehensive 3-4 sentences
        parts = [opening]
        if prod_mention:
            parts.append(prod_mention.strip())
        parts.append(feature)
        parts.append(delivery)
        parts.append(closing)
        return " ".join(parts)

    else:
        # Default natural Kerala mix
        structures = [
            f"{opening} {feature} {delivery} {closing}",
            f"{opening} {delivery} {closing}",
            f"{delivery} {opening} {feature} {closing}",
            f"{opening} {prod_mention}{feature} {closing}",
        ]
        return random.choice(structures).strip()


def calculate_rating(rating_skew: str = "high") -> int:
    """Calculates star rating based on skew strategy."""
    rand = random.random()
    if rating_skew == "perfect":
        return 5
    elif rating_skew == "balanced":
        # ~70% 5-star, 24% 4-star, 6% 3-star (Avg ~4.64)
        if rand < 0.70:
            return 5
        elif rand < 0.94:
            return 4
        return 3
    else:
        # Default "high" (~84% 5-star, 13% 4-star, 3% 3-star -> Avg ~4.81)
        if rand < 0.84:
            return 5
        elif rand < 0.97:
            return 4
        return 3


def generate_kerala_reviews_for_product(
    product: Product,
    count: int = 100,
    tone: str = "natural",
    rating_skew: str = "high",
    verified: bool = True,
    clear_existing: bool = False
) -> dict:
    """
    Core engine: generates `count` authentic Kerala reviews for a product in 1-click.
    Guarantees unique customers per review, randomized organic dates, and updates product aggregates.
    """
    if clear_existing:
        Review.objects.filter(product=product).delete()

    existing_customer_ids = set(Review.objects.filter(product=product).values_list('customer_id', flat=True))
    category_key = detect_product_category(product)

    # Shuffle personas to get maximum diversity
    personas_pool = list(KERALA_PERSONAS)
    random.shuffle(personas_pool)

    # Current time baseline for spreading dates across past 7 to 90 days
    now = timezone.now()

    created_reviews = []
    persona_idx = 0

    with transaction.atomic():
        for i in range(count):
            persona = personas_pool[persona_idx % len(personas_pool)]
            persona_idx += 1

            # Unique email per customer & product to ensure uniqueness
            clean_name_slug = re.sub(r'[^a-z0-9]', '', persona["name"].lower())
            customer_email = f"{clean_name_slug}.{persona['city'].lower()}.{i+1}@keralamart.in"

            # Find or create customer
            customer, _ = Customer.objects.get_or_create(
                email=customer_email,
                defaults={
                    "name": persona["name"],
                    "phone": f"+91 9{random.randint(100000000, 999999999)}",
                    "city": persona["city"],
                    "pincode": persona["pincode"],
                    "address": f"Near Civil Station, {persona['city']}, Kerala",
                    "successful_deliveries": 1,
                }
            )

            # Avoid unique_together collision if customer already reviewed this product
            if customer.id in existing_customer_ids:
                # generate variant email
                variant_email = f"{clean_name_slug}.v{i+1}.{random.randint(100,999)}@keralamart.in"
                customer = Customer.objects.create(
                    name=persona["name"],
                    email=variant_email,
                    phone=f"+91 9{random.randint(100000000, 999999999)}",
                    city=persona["city"],
                    pincode=persona["pincode"],
                    address=f"Near Town Bus Stand, {persona['city']}, Kerala",
                    successful_deliveries=1,
                )

            existing_customer_ids.add(customer.id)

            rating = calculate_rating(rating_skew)
            comment = generate_single_review_text(
                product=product,
                category_key=category_key,
                rating=rating,
                city=persona["city"],
                tone=tone
            )

            # Distribute dates organically between 3 and 75 days ago
            days_ago = random.randint(3, 75)
            hours_ago = random.randint(0, 23)
            mins_ago = random.randint(0, 59)
            review_date = now - timedelta(days=days_ago, hours=hours_ago, minutes=mins_ago)

            review = Review(
                product=product,
                customer=customer,
                rating=rating,
                comment=comment,
                verified=verified,
            )
            # Assign created_at manually
            review.save()
            # Update created_at to past timestamp
            Review.objects.filter(pk=review.pk).update(created_at=review_date)

            created_reviews.append(review)

        # Recalculate and update product aggregate rating and review count
        all_reviews = Review.objects.filter(product=product)
        avg_rating = all_reviews.aggregate(Avg('rating'))['rating__avg'] or 5.0
        review_count = all_reviews.count()

        product.rating = round(avg_rating, 1)
        product.review_count = review_count
        product.save(update_fields=['rating', 'review_count'])

    return {
        "success": True,
        "product_id": product.id,
        "product_name": product.name,
        "category_detected": category_key,
        "generated_count": len(created_reviews),
        "total_reviews": product.review_count,
        "new_rating": float(product.rating),
    }


def get_product_review_stats(product: Product) -> dict:
    """Returns detailed review stats for a product."""
    reviews = Review.objects.filter(product=product)
    total = reviews.count()
    if total == 0:
        return {
            "total_reviews": 0,
            "average_rating": 0.0,
            "distribution": {5: 0, 4: 0, 3: 0, 2: 0, 1: 0},
            "latest_reviews": []
        }

    distribution = {
        5: reviews.filter(rating=5).count(),
        4: reviews.filter(rating=4).count(),
        3: reviews.filter(rating=3).count(),
        2: reviews.filter(rating=2).count(),
        1: reviews.filter(rating=1).count(),
    }
    avg = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0

    latest = []
    for r in reviews.order_by('-created_at')[:5]:
        latest.append({
            "id": r.id,
            "customer_name": r.customer.name,
            "city": r.customer.city,
            "rating": r.rating,
            "comment": r.comment,
            "verified": r.verified,
            "created_at": r.created_at.strftime('%Y-%m-%d') if r.created_at else ''
        })

    return {
        "total_reviews": total,
        "average_rating": round(avg, 1),
        "distribution": distribution,
        "latest_reviews": latest
    }
