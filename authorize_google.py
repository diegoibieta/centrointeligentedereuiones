from google_auth_oauthlib.flow import InstalledAppFlow
import json

SCOPES = ['https://www.googleapis.com/auth/calendar']

flow = InstalledAppFlow.from_client_secrets_file('backend/credentials.json', SCOPES)
creds = flow.run_local_server(port=0)

with open('backend/token.json', 'w') as f:
    f.write(creds.to_json())

print("token.json generado exitosamente")