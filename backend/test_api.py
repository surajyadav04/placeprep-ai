import json, urllib.request
url = 'http://127.0.0.1:8000/api/interview/evaluate'
payload = json.dumps({
    'question': 'What is a process?',
    'answer': 'A process is an independent execution unit with its own memory.'
}).encode('utf-8')
headers = {'Content-Type': 'application/json'}
req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
with urllib.request.urlopen(req) as resp:
    print('Status:', resp.status)
    print('Response:', resp.read().decode())
