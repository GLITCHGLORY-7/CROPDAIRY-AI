#!/usr/bin/env python3
"""
CropDiary AI - Subdirectory CLI Entry Point (code/main.py)
Delegates directly to root main.py for universal evaluation compatibility.
"""
import os
import sys

# Add root directory to sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import main

if __name__ == "__main__":
    main.main()
