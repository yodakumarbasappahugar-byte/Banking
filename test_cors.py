import urllib.request
import json
import urllib.error

url = "https://banking-backend-api.onrender.com/api/auth/signup"
headers = {
    "Origin": "https://nidhibank.vercel.app",
    "Content-Type": "application/json"
}
data = json.dumps({"email":"test@test.com", "mobile_number":"1234567890", "password":"password"}).encode("utf-8")

req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Headers:")
        for k, v in response.getheaders():
            print(f"  {k}: {v}")
        print("Body:", response.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("Error Status:", e.code)
    print("Error Headers:")
    for k, v in e.headers.items():
        print(f"  {k}: {v}")
    print("Error Body:", e.read().decode("utf-8"))
except urllib.error.URLError as e:
    print("URL Error:", e.reason)
