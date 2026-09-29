from enum import Enum

class Role(str, Enum):
    CITIZEN = "citizen"
    OFFICER = "officer"
    ADMIN = "admin"

class Category(str, Enum):
    WATER = "water"
    ROADS = "roads"
    ELECTRICITY = "electricity"
    HEALTH = "health"
    EDUCATION = "education"
    SANITATION = "sanitation"
    HOUSING = "housing"
    AGRICULTURE = "agriculture"
    TRANSPORT = "transport"
    OTHER = "other"

class Status(str, Enum):
    RECEIVED = "received"
    VERIFIED = "verified"
    UNDER_REVIEW = "under_review"
    FUNDED = "funded"
    COMPLETED = "completed"
    REJECTED = "rejected"
