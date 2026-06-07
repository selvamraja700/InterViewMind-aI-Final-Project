import sys
import os

# Add backend/ root to sys.path so `services.*` and `database.*` resolve correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
