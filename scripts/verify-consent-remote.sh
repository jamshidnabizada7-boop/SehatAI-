SECRET=$(sudo grep ^STAGING_ACCESS_SECRET /etc/sehatai/staging.env | cut -d= -f2 | tr -d "\"' ")
echo "Testing /docs/legal/telemedicine-consent..."
CODE1=$(curl -s -o /tmp/consent1.html -w "%{http_code}" -H "x-staging-access-key: $SECRET" http://127.0.0.1:4000/docs/legal/telemedicine-consent)
echo "HTTP code: $CODE1"
grep -o "Informed Consent for Telemedicine" /tmp/consent1.html | head -n 1
grep -o "DRAFT — REQUIRES COUNSEL REVIEW" /tmp/consent1.html | head -n 1

echo "Testing /docs/legal/telemedicine-consent.md..."
CODE2=$(curl -s -o /tmp/consent2.html -w "%{http_code}" -H "x-staging-access-key: $SECRET" http://127.0.0.1:4000/docs/legal/telemedicine-consent.md)
echo "HTTP code: $CODE2"
grep -o "Informed Consent for Telemedicine" /tmp/consent2.html | head -n 1
grep -o "DRAFT — REQUIRES COUNSEL REVIEW" /tmp/consent2.html | head -n 1
