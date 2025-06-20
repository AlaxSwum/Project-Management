#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/Users/swumpyaesone/Documents/project_management/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from projects.google_drive_manager import GoogleDriveManager

def test_drive_connection():
    try:
        print("Testing Google Drive connection...")
        drive_manager = GoogleDriveManager()
        
        print("Listing all files from Google Drive (including shared folders)...")
        files = drive_manager.list_files()
        
        print(f"Found {len(files)} files/folders:")
        
        folders = []
        other_files = []
        
        for file in files:
            if file['mimeType'] == 'application/vnd.google-apps.folder':
                folders.append(file)
            else:
                other_files.append(file)
        
        print(f"\n📁 FOLDERS ({len(folders)}):")
        for folder in folders:
            print(f"  - {folder['name']} (ID: {folder['id']})")
        
        print(f"\n📄 FILES ({len(other_files)}):")
        for file in other_files[:10]:  # Show first 10 files
            print(f"  - {file['name']} ({file['mimeType']})")
        
        if len(other_files) > 10:
            print(f"  ... and {len(other_files) - 10} more files")
            
        print(f"\nService account email: bona-fide-project-management@projectmanagement-463423.iam.gserviceaccount.com")
        print("To see your personal Google Drive folders, share them with the service account email above.")
            
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_drive_connection() 