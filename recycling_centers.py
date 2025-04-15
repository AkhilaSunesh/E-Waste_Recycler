import logging
import json
import math
import random
from models import RecyclingCenter
from app import db

# Sample recycling centers data
# In a real application, this would come from a real API or database
SAMPLE_CENTERS = [
    {
        "name": "Green Future Recycling",
        "address": "123 Eco Street, Green City",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "phone": "555-123-4567",
        "website": "https://greenfuturerecycling.example.com",
        "materials_accepted": "Electronics, Batteries, Metals, Glass",
        "hours": "Mon-Fri: 9AM-5PM, Sat: 10AM-3PM"
    },
    {
        "name": "Tech Recyclers Inc.",
        "address": "456 Circuit Avenue, Techville",
        "latitude": 40.7282,
        "longitude": -73.9942,
        "phone": "555-987-6543",
        "website": "https://techrecyclers.example.com",
        "materials_accepted": "Computers, Phones, Tablets, Printers, TVs",
        "hours": "Mon-Sat: 8AM-6PM"
    },
    {
        "name": "E-Waste Solutions",
        "address": "789 Renewal Road, Eco Park",
        "latitude": 40.7023,
        "longitude": -74.0156,
        "phone": "555-456-7890",
        "website": "https://ewastesolutions.example.com",
        "materials_accepted": "All electronics, Batteries, Light bulbs",
        "hours": "Tue-Sun: 10AM-7PM"
    }
]

def seed_sample_centers():
    """Seed the database with sample recycling centers if it's empty"""
    count = RecyclingCenter.query.count()
    if count == 0:
        logging.info("Seeding database with sample recycling centers")
        for center_data in SAMPLE_CENTERS:
            center = RecyclingCenter(**center_data)
            db.session.add(center)
        db.session.commit()

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using the Haversine formula"""
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    # Radius of earth in kilometers
    r = 6371
    return c * r

def find_nearby_centers(latitude, longitude, radius=10):
    """
    Find recycling centers near the specified location
    
    Parameters:
    latitude (float): Latitude of the user's location
    longitude (float): Longitude of the user's location
    radius (float): Search radius in kilometers
    
    Returns:
    list: List of recycling centers within the specified radius
    """
    logging.info(f"Finding recycling centers near ({latitude}, {longitude}) within {radius}km")
    
    try:
        # Ensure we have sample data
        seed_sample_centers()
        
        # Get centers from database
        centers = RecyclingCenter.query.all()
        
        # Calculate distance and filter centers within radius
        nearby_centers = []
        for center in centers:
            distance = calculate_distance(latitude, longitude, center.latitude, center.longitude)
            if distance <= radius:
                center_data = {
                    "id": center.id,
                    "name": center.name,
                    "address": center.address,
                    "latitude": center.latitude,
                    "longitude": center.longitude,
                    "phone": center.phone,
                    "website": center.website,
                    "materials_accepted": center.materials_accepted,
                    "hours": center.hours,
                    "distance": round(distance, 2)
                }
                nearby_centers.append(center_data)
        
        # Sort by distance
        nearby_centers.sort(key=lambda x: x["distance"])
        
        return nearby_centers
    
    except Exception as e:
        logging.error(f"Error finding nearby recycling centers: {str(e)}")
        raise e
