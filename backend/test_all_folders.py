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

def test_oauth_access():
    """Test OAuth access to personal Google Drive"""
    print("=" * 60)
    print("TESTING OAUTH ACCESS (Personal Google Drive)")
    print("=" * 60)
    
    try:
        # Use OAuth to access personal Google Drive
        drive_manager = GoogleDriveManager(use_oauth=True)
        
        print("✅ OAuth connection successful!")
        print("📁 Listing ALL folders and files from your personal Google Drive...")
        
        # Get all files and folders
        files = drive_manager.list_files(page_size=1000)  # Get more files
        
        if not files:
            print("❌ No files found. This might indicate an authentication issue.")
            return False
        
        print(f"🎉 Found {len(files)} total items in your Google Drive!")
        
        # Separate folders and files
        folders = [f for f in files if f['mimeType'] == 'application/vnd.google-apps.folder']
        other_files = [f for f in files if f['mimeType'] != 'application/vnd.google-apps.folder']
        
        print(f"\n📁 FOLDERS ({len(folders)}):")
        for i, folder in enumerate(folders, 1):
            print(f"  {i:2d}. {folder['name']} (ID: {folder['id']})")
            
            # Test accessing contents of each folder
            folder_contents = drive_manager.list_files(folder_id=folder['id'])
            print(f"      └── Contains {len(folder_contents)} items")
        
        print(f"\n📄 OTHER FILES ({len(other_files)}):")
        for i, file in enumerate(other_files[:20], 1):  # Show first 20 files
            file_size = file.get('size', 'Unknown size')
            if file_size != 'Unknown size':
                file_size = f"{int(file_size):,} bytes"
            print(f"  {i:2d}. {file['name']} ({file_size})")
        
        if len(other_files) > 20:
            print(f"      ... and {len(other_files) - 20} more files")
        
        # Test search functionality
        print(f"\n🔍 Testing search functionality...")
        search_results = drive_manager.search_files("test")
        print(f"   Found {len(search_results)} files containing 'test'")
        
        return True
        
    except Exception as e:
        print(f"❌ OAuth access failed: {e}")
        return False

def test_service_account_access():
    """Test Service Account access"""
    print("\n" + "=" * 60)
    print("TESTING SERVICE ACCOUNT ACCESS")
    print("=" * 60)
    
    try:
        # Use Service Account
        drive_manager = GoogleDriveManager(use_oauth=False)
        
        print("✅ Service Account connection successful!")
        
        files = drive_manager.list_files()
        
        print(f"📁 Service Account can see {len(files)} shared items")
        
        if files:
            folders = [f for f in files if f['mimeType'] == 'application/vnd.google-apps.folder']
            other_files = [f for f in files if f['mimeType'] != 'application/vnd.google-apps.folder']
            
            print(f"\n📁 SHARED FOLDERS ({len(folders)}):")
            for folder in folders:
                print(f"  - {folder['name']}")
            
            print(f"\n📄 SHARED FILES ({len(other_files)}):")
            for file in other_files[:10]:
                print(f"  - {file['name']}")
        else:
            print("ℹ️  No files visible to service account.")
            print("   To share folders with service account, share them with:")
            print("   📧 bona-fide-project-management@projectmanagement-463423.iam.gserviceaccount.com")
        
        return True
        
    except Exception as e:
        print(f"❌ Service Account access failed: {e}")
        return False

def main():
    print("🚀 COMPREHENSIVE GOOGLE DRIVE ACCESS TEST")
    print("Testing both OAuth and Service Account access methods...\n")
    
    # Test OAuth access (recommended for personal use)
    oauth_success = test_oauth_access()
    
    # Test Service Account access
    service_success = test_service_account_access()
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    if oauth_success:
        print("✅ OAuth Access: SUCCESS - You can access ALL your personal Google Drive folders!")
        print("   This is the recommended method for your personal files.")
    else:
        print("❌ OAuth Access: FAILED - Authentication issues detected.")
    
    if service_success:
        print("✅ Service Account Access: SUCCESS - Can access shared folders.")
    else:
        print("❌ Service Account Access: FAILED")
    
    print("\n📋 RECOMMENDATIONS:")
    if oauth_success:
        print("   • Use OAuth method (use_oauth=True) for accessing your personal Drive")
        print("   • Your app in 'Testing' mode is perfect for this!")
        print("   • No need to publish the app for personal use")
    else:
        print("   • Check OAuth credentials and re-authorize if needed")
        print("   • Make sure you're using the correct Google account")
    
    print(f"\n🎯 CONCLUSION: {'SUCCESS' if oauth_success else 'NEEDS ATTENTION'}")

if __name__ == "__main__":
    main() 