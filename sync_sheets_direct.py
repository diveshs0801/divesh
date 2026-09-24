#!/usr/bin/env python3
"""
Direct Google Sheets Sync Tool for Divesh S
Uses service_account.json to read, update status, and manage the live Google Sheet.

Usage:
  python3 sync_sheets_direct.py update "Razorpay" "Applied" "2026-09-24"
  python3 sync_sheets_direct.py list
  python3 sync_sheets_direct.py stats
"""

import sys, json, urllib.request, urllib.parse
from google.oauth2 import service_account
import google.auth.transport.requests

SPREADSHEET_ID = '1xlZaeXGR9gNizceCRqLUXazImRNukfjXc1_kZC1d7z0'
KEY_PATH = '/home/webnox/Downloads/divesh/service_account.json'
SHEET_NAME = 'Job_Application_Tracker'

def get_auth_token():
    creds = service_account.Credentials.from_service_account_file(
        KEY_PATH,
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token

def update_company_status(company_name, new_status, applied_date=None):
    token = get_auth_token()
    # 1. Fetch Company column (Col A)
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{SHEET_NAME}!A:A'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        companies = [r[0] if r else '' for r in data.get('values', [])]

    # Find row (1-indexed)
    target_row = None
    name_lower = company_name.lower().strip()
    for idx, c in enumerate(companies):
        if idx == 0: continue
        if c.lower().strip() == name_lower or name_lower in c.lower():
            target_row = idx + 1
            matched_name = c
            break

    if not target_row:
        print(f"❌ Company '{company_name}' not found in Google Sheet.")
        return False

    # Col G is Status, Col H is Date Applied
    status_range = f'{SHEET_NAME}!G{target_row}'
    body = {'values': [[new_status]]}
    
    update_url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{status_range}?valueInputOption=USER_ENTERED'
    req = urllib.request.Request(update_url, data=json.dumps(body).encode('utf-8'), headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }, method='PUT')
    with urllib.request.urlopen(req) as resp:
        pass

    if applied_date:
        date_range = f'{SHEET_NAME}!H{target_row}'
        body_date = {'values': [[applied_date]]}
        update_url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{date_range}?valueInputOption=USER_ENTERED'
        req = urllib.request.Request(update_url, data=json.dumps(body_date).encode('utf-8'), headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }, method='PUT')
        with urllib.request.urlopen(req) as resp:
            pass

    print(f"✅ Successfully updated '{matched_name}' (Row {target_row}) -> Status: '{new_status}'" + (f", Date: {applied_date}" if applied_date else ""))
    return True

def print_stats():
    token = get_auth_token()
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{SHEET_NAME}!A:W'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        rows = data.get('values', [])
    
    total = len(rows) - 1
    statuses = {}
    priorities = {}
    for r in rows[1:]:
        status = r[6] if len(r) > 6 else 'Not Applied'
        prio = r[22] if len(r) > 22 else 'MEDIUM'
        statuses[status] = statuses.get(status, 0) + 1
        priorities[prio] = priorities.get(prio, 0) + 1

    print("\n==================================================")
    print(f"📊 Job Application Tracker Status: {total} Companies")
    print("==================================================")
    print("Application Status Breakdown:")
    for s, c in statuses.items():
        print(f"  • {s}: {c}")
    print("\nPriority Breakdown:")
    for p, c in priorities.items():
        print(f"  • {p}: {c}")
    print("==================================================\n")

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or args[0] == 'stats':
        print_stats()
    elif args[0] == 'update':
        if len(args) < 3:
            print("Usage: python3 sync_sheets_direct.py update <Company> <Status> [YYYY-MM-DD]")
            sys.exit(1)
        company = args[1]
        status = args[2]
        date = args[3] if len(args) > 3 else None
        update_company_status(company, status, date)
    else:
        print("Commands: stats | update <Company> <Status> [Date]")
