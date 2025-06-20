from google.oauth2 import service_account
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaFileUpload
import io
import json
import os
import pickle

class GoogleDriveManager:
    def __init__(self, use_oauth=True):
        # Load credentials
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        if use_oauth:
            # Use OAuth2 for personal Google Drive access
            self.service = self._build_oauth_service(current_dir)
        else:
            # Use service account (default)
            credentials_path = os.path.join(current_dir, 'google_drive_credentials.json')
            credentials = service_account.Credentials.from_service_account_file(
                credentials_path,
                scopes=['https://www.googleapis.com/auth/drive']
            )
            self.service = build('drive', 'v3', credentials=credentials)
            
            # Print service account email for sharing instructions
            with open(credentials_path, 'r') as f:
                creds_data = json.load(f)
                service_email = creds_data.get('client_email', '')
                print(f"\n📁 To access your personal Google Drive folders:")
                print(f"   Share your folders with: {service_email}")
                print(f"   Give 'Editor' permissions to upload files\n")
    
    def _build_oauth_service(self, current_dir):
        """Build the Drive API service using OAuth2"""
        SCOPES = ['https://www.googleapis.com/auth/drive']
        creds = None
        
        # Token file to store the user's access and refresh tokens
        token_path = os.path.join(current_dir, 'token.pickle')
        
        # Check if we have stored credentials
        if os.path.exists(token_path):
            with open(token_path, 'rb') as token:
                creds = pickle.load(token)
        
        # If there are no (valid) credentials available, start OAuth flow
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"Error refreshing token: {e}")
                    creds = None
            
            if not creds:
                # Start OAuth flow
                oauth_path = os.path.join(current_dir, 'oauth_credentials.json')
                if os.path.exists(oauth_path):
                    try:
                        flow = Flow.from_client_secrets_file(
                            oauth_path,
                            scopes=SCOPES
                        )
                        # Use localhost redirect for better compatibility
                        flow.redirect_uri = 'http://localhost:8080'
                        
                        # Get authorization URL
                        auth_url, _ = flow.authorization_url(
                            prompt='consent',
                            access_type='offline'
                        )
                        
                        print("\n" + "="*60)
                        print("GOOGLE DRIVE AUTHORIZATION REQUIRED")
                        print("="*60)
                        print(f"Please visit this URL to authorize the application:")
                        print(f"{auth_url}")
                        print("="*60)
                        print("After authorization, you'll be redirected to a page that may show an error.")
                        print("Copy the 'code' parameter from the URL and paste it below.")
                        print("The URL will look like: http://localhost:8080/?code=XXXXXX&scope=...")
                        
                        # Get the authorization code from user
                        auth_code = input("Enter the authorization code: ").strip()
                        
                        # Exchange authorization code for credentials
                        flow.fetch_token(code=auth_code)
                        creds = flow.credentials
                        
                        print("Authorization successful!")
                        
                    except Exception as e:
                        print(f"OAuth flow error: {e}")
                        print("Falling back to service account...")
                        # Fall back to service account
                        credentials_path = os.path.join(current_dir, 'google_drive_credentials.json')
                        if os.path.exists(credentials_path):
                            creds = service_account.Credentials.from_service_account_file(
                                credentials_path,
                                scopes=SCOPES
                            )
                        else:
                            raise Exception("No valid credentials found")
                else:
                    # Fall back to service account
                    print("OAuth credentials not found, using service account...")
                    credentials_path = os.path.join(current_dir, 'google_drive_credentials.json')
                    if os.path.exists(credentials_path):
                        creds = service_account.Credentials.from_service_account_file(
                            credentials_path,
                            scopes=SCOPES
                        )
                    else:
                        raise Exception("No valid credentials found")
            
            # Save the credentials for the next run
            if creds and hasattr(creds, 'refresh_token'):
                with open(token_path, 'wb') as token:
                    pickle.dump(creds, token)
        
        return build('drive', 'v3', credentials=creds)
    
    def list_files(self, folder_id=None, page_size=100):
        """
        List files in Google Drive with optional folder filtering
        """
        try:
            # Prepare the query
            query_parts = ["trashed = false"]
            if folder_id:
                query_parts.append(f"'{folder_id}' in parents")
            
            search_query = " and ".join(query_parts)
            
            # Execute the files.list method
            results = self.service.files().list(
                q=search_query,
                pageSize=page_size,
                fields="nextPageToken, files(id, name, mimeType, parents, modifiedTime, size, webViewLink)",
                orderBy="folder,name"
            ).execute()
            
            files = results.get('files', [])
            
            # Sort folders first, then files
            folders = [f for f in files if f['mimeType'] == 'application/vnd.google-apps.folder']
            other_files = [f for f in files if f['mimeType'] != 'application/vnd.google-apps.folder']
            
            return folders + other_files
            
        except Exception as e:
            print(f"An error occurred listing files: {e}")
            return []
    
    def search_files(self, query_string):
        """
        Search for files in Google Drive
        """
        try:
            # Prepare the search query
            search_query = f"name contains '{query_string}' and trashed = false"
            
            # Execute the search
            results = self.service.files().list(
                q=search_query,
                fields="files(id, name, mimeType, parents, modifiedTime, size, webViewLink)",
                orderBy="folder,name"
            ).execute()
            
            return results.get('files', [])
            
        except Exception as e:
            print(f"An error occurred searching files: {e}")
            return []
    
    def create_folder(self, folder_name, parent_id=None):
        """
        Create a new folder in Google Drive
        """
        try:
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            if parent_id:
                file_metadata['parents'] = [parent_id]
            
            file = self.service.files().create(
                body=file_metadata,
                fields='id, name, mimeType, parents, modifiedTime'
            ).execute()
            
            return file
            
        except Exception as e:
            print(f"An error occurred creating folder: {e}")
            return None
    
    def upload_file(self, file_path, file_name, parent_id=None):
        """
        Upload a file to Google Drive from file path
        """
        try:
            file_metadata = {'name': file_name}
            if parent_id:
                file_metadata['parents'] = [parent_id]
            
            # Create the media upload object from file path
            media = MediaFileUpload(file_path, resumable=True)
            
            # Execute the upload
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, mimeType, parents, modifiedTime, webViewLink'
            ).execute()
            
            return file
            
        except Exception as e:
            print(f"An error occurred uploading file: {e}")
            return None

    def get_file_content(self, file_id):
        """
        Get the content of a file from Google Drive
        """
        try:
            from googleapiclient.http import MediaIoBaseDownload
            
            # Get the file metadata
            file = self.service.files().get(fileId=file_id).execute()
            
            # Download the file content
            request = self.service.files().get_media(fileId=file_id)
            file_content = io.BytesIO()
            downloader = MediaIoBaseDownload(file_content, request)
            
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            return file_content.getvalue()
            
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def delete_file(self, file_id):
        """
        Delete a file from Google Drive
        """
        try:
            self.service.files().delete(fileId=file_id).execute()
            return True
        except Exception as e:
            print(f"An error occurred: {e}")
            return False
    
    def move_file(self, file_id, new_parent_id):
        """
        Move a file to a different folder in Google Drive
        """
        try:
            # Get the file's current parents
            file = self.service.files().get(
                fileId=file_id,
                fields='parents'
            ).execute()
            
            # Remove the previous parents and add the new parent
            previous_parents = ",".join(file.get('parents', []))
            file = self.service.files().update(
                fileId=file_id,
                addParents=new_parent_id,
                removeParents=previous_parents,
                fields='id, parents'
            ).execute()
            
            return True
            
        except Exception as e:
            print(f"An error occurred: {e}")
            return False 